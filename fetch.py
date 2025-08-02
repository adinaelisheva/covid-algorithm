# Modified from https://github.com/harrislapiroff/mwra-wastewater-scraper/tree/main/wastewater

import requests
import tabula
from bs4 import BeautifulSoup
import math
from datetime import datetime
import pandas

MWRA_LINK_INFIX = 'mwradata'
MWRA_LINK_SUFFIX = '-datapdf'
MWRA_BASE_URL = 'https://www.mwra.com'

FLURL = 'https://www.mass.gov/doc/flu-dashboard-data/download'
FLU_SHEET_NAME = 'Regional Activity'
FLU_LEVEL_STRS = ['Minimal', 'Low', 'Moderate', 'High', 'Very High']
FLU_DATE_COL = 'Week End Date'
FLU_REGION_COL = 'Region Name'
FLU_ACTIVITY_COL = 'Activity level'

### Get COVID data

print('fetching data at', datetime.now())

res = requests.get(MWRA_BASE_URL + '/biobot/biobotdata.htm')

soup = BeautifulSoup(res.text, 'html.parser')
link = soup.select(f"a[href*='{MWRA_LINK_INFIX}'][href$='{MWRA_LINK_SUFFIX}']")[0].attrs['href']
pdf_url = MWRA_BASE_URL + link

data = tabula.io.read_pdf(pdf_url, pages='all', lattice=True)

print('\n\ngot data from biobot site')

# find the last page with any data
index = 0
found = False
for page in reversed(data):
  print(f'checking page {index} for data')
  index = index + 1
  try:
    page.columns = ['date', 'south', 'north', 'south 7da', 'north 7da', 'south lci', 'south hci', 'north lci', 'north hci']
  except:
    continue
  if math.isnan(page.at[0, 'north 7da']):
    continue
  found = True
  break

if not found:
  print('no pages with valid data found')
  quit()

print('got page with data')

# find the last row with data - it's the most recent
date = ''
amt = 0
for i in reversed(page.index):
  date = page.at[i, 'date']
  print(f'looking at row{i}: {date}')
  north = page.at[i, 'north 7da']
  south = page.at[i, 'south 7da']
  print(f'north is {north} and south is {south}')
  if not math.isnan(north) and not math.isnan(south):
    print('got data')
    date = page.at[i, 'date']
    # If north is higher, use it. Otherwise, an average
    amt = (north + south) / 2
    if (north > south):
      amt = north
    break

coviddatastr = f'["{date}", {amt}]'

# Now get flu data
data = pandas.read_excel(FLURL, sheet_name=FLU_SHEET_NAME)

print('\n\ngot flu data from mass.gov site')

i = 1
latestdate = data[FLU_DATE_COL].iloc[i].strftime("%m/%d/%Y")
maxlevel = 0
while True:
  date = data[FLU_DATE_COL].iloc[i].strftime("%m/%d/%Y")
  print(f'looking at row {i} for {date}')
  if date != latestdate:
    print('Data collection done')
    break
  location = data[FLU_REGION_COL].iloc[i]
  levelstr = data[FLU_ACTIVITY_COL].iloc[i]
  level = FLU_LEVEL_STRS.index(levelstr)
  print(f'{location} is {levelstr}')

  if level > maxlevel:
    maxlevel = level
  i += 1

fludatastr = f'["{latestdate}", {level}]'

# put everything in the file
with open('data.js', 'w') as f:
  f.write('coviddata = ' + coviddatastr)
  f.write('\nfludata = ' + fludatastr)
  print(f'Wrote: covid = {coviddatastr}, flu = {fludatastr}')
