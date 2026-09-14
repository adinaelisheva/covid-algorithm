# Modified from https://github.com/harrislapiroff/mwra-wastewater-scraper/tree/main/wastewater

import requests
import pymupdf
from bs4 import BeautifulSoup
from datetime import datetime
import pandas
import re

COV_BASE_URL = 'https://boston.gov'
COV_LINK_SUFFIX = 'ww_resp_report.pdf'

FLURL = 'https://www.mass.gov/doc/flu-dashboard-data/download'
FLU_SHEET_NAME = 'Regional Activity'
FLU_LEVEL_STRS = ['Minimal', 'Low', 'Moderate', 'High', 'Very High']
FLU_RELEVANT_REGIONS = ['Boston', 'Inner Metro Boston', 'Northeast', 'Outer Metro Boston']
FLU_DATE_COL = 'Week End Date'
FLU_REGION_COL = 'Region Name'
FLU_ACTIVITY_COL = 'Activity level'
NOW = datetime.now()

### Get COVID data

print('fetching data at', NOW)

url = COV_BASE_URL + '/government/cabinets/boston-public-health-commission/boston-wastewater-monitoring'
print('navigating to', url)
res = requests.get(url)
soup = BeautifulSoup(res.text, 'html.parser')

selectorBase = f"a[href*='{COV_LINK_SUFFIX}']"
print('attempting to select pdf via ', selectorBase, ' for the most recent date:')
dateStr = NOW.strftime("/%Y-%m-")
dayNum = NOW.day

print(f'Checking {dateStr}{dayNum}...')
pdfAnchor = soup.select(selectorBase + f"[href*='{dateStr}{dayNum}']")
while len(pdfAnchor) == 0:
  dayNum = 31 if dayNum == 0 else dayNum - 1
  if dayNum == NOW.day:
    # We've looped all the way around; abort
    break
  print(f'Checking {dateStr}{dayNum}...')
  pdfAnchor = soup.select(selectorBase + f"[href*='{dateStr}{dayNum}']")
print('Found.')
pdfUrl = COV_BASE_URL + pdfAnchor[0].attrs['href']

r = requests.get(pdfUrl)
data = r.content
doc = pymupdf.Document(stream=data)

print('\n\ngot data from Boston site')
exp = re.search('Data Complete Through: ([^\\n]+)',doc[0].get_text())
coviddatestr = datetime.strptime(exp.group(1).strip(), "%d-%b-%Y").strftime("%m/%d/%Y")
exp = re.search('\\d+-(\\d+)\\s+RNA copies/mL\\s+RANGE ACROSS',doc[3].get_text())
amt = exp.group(1)
coviddatastr = f'["{coviddatestr}", {amt}]'

# Now get flu data
data = pandas.read_excel(FLURL, sheet_name=FLU_SHEET_NAME)

print('\n\ngot flu data from mass.gov site')

i = data.shape[0] - 1; # index of the last row
latestdate = data[FLU_DATE_COL].iloc[i].strftime("%m/%d/%Y")
maxlevel = 0
while True:
  date = data[FLU_DATE_COL].iloc[i].strftime("%m/%d/%Y")
  print(f'looking at row {i} for {date}')
  if date != latestdate:
    print('Data collection done')
    break
  location = data[FLU_REGION_COL].iloc[i]
  if location not in FLU_RELEVANT_REGIONS:
    print(f'Skipping {location}')
    i -= 1
    continue
  levelstr = data[FLU_ACTIVITY_COL].iloc[i]
  level = FLU_LEVEL_STRS.index(levelstr)
  print(f'{location} is {levelstr}')

  if level > maxlevel:
    maxlevel = level
  i -= 1

fludatastr = f'["{latestdate}", {maxlevel}]'

# put everything in the file
with open('data.js', 'w') as f:
  f.write('coviddata = ' + coviddatastr)
  f.write('\nfludata = ' + fludatastr)
  print(f'Wrote: covid = {coviddatastr}, flu = {fludatastr}')
