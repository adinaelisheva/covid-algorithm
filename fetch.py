# Modified from https://github.com/harrislapiroff/mwra-wastewater-scraper/tree/main/wastewater

import requests
import tabula
from bs4 import BeautifulSoup
import math
from datetime import datetime

print('fetching covid data at', datetime.now())

LINK_INFIX = 'MWRAData'
LINK_SUFFIX = '-data.pdf'

res = requests.get('https://www.mwra.com/biobot/biobotdata.htm')
base_url = '/'.join(res.url.split('/')[:-1]) + '/'

soup = BeautifulSoup(res.text, 'html.parser')
link = soup.select(f"a[href*='{LINK_INFIX}'][href$='{LINK_SUFFIX}']")[0].attrs['href']
pdf_url = base_url + link

data = tabula.io.read_pdf(pdf_url, pages='all', lattice=True)

print('got data from biobot site')

# find the last page with any data
index = 0
for page in reversed(data):
  print('checking page', index, 'for data')
  index = index + 1
  page.columns = ['date', 'south', 'north', 'south 7da', 'north 7da', 'south lci', 'south hci', 'north lci', 'north hci']
  if not math.isnan(page.at[0, 'north 7da']):
    break

print('got page with data')

# find the last row with data - it's the most recent
date = ''
amt = 0
for i in reversed(page.index):
  print('looking at row', i)
  north = page.at[i, 'north 7da']
  south = page.at[i, 'south 7da']
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

print('Wrote:', datastr)
