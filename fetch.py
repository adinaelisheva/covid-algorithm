# Modified from https://github.com/harrislapiroff/mwra-wastewater-scraper/tree/main/wastewater

import requests
import tabula
from bs4 import BeautifulSoup
import math
from datetime import datetime

print('fetching covid data at', datetime.now())

LINK_INFIX = 'mwradata'
LINK_SUFFIX = '-data'
BASE_URL = 'https://www.mwra.com'

res = requests.get(BASE_URL + '/biobot/biobotdata.htm')

soup = BeautifulSoup(res.text, 'html.parser')
link = soup.select(f"a[href*='{LINK_INFIX}'][href$='{LINK_SUFFIX}']")[0].attrs['href']
pdf_url = BASE_URL + link

data = tabula.io.read_pdf(pdf_url, pages='all', lattice=True)

print('got data from biobot site')

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

datastr = f'["{date}", {amt}]'

# put this in the file
with open('mwra.js', 'w') as f:
  f.write('mwradata = ' + datastr)

print(f'Wrote: {datastr}')
