import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
import random
import re

def scrape_cl_listings(city='newyork', borough='mnh', count=1000):
    base_url = f"https://{city}.craigslist.org/search/{borough}/apa"
    listings = []
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    print(f"Starting scrape for {city}/{borough}...")
    
    # Craigslist shows 120 items per page
    # We need ~9 pages for 1000 items
    for page in range(0, count, 120):
        url = f"{base_url}?s={page}"
        print(f"Fetching {url}")
        
        try:
            response = requests.get(url, headers=headers)
            if response.status_code != 200:
                print(f"Failed to fetch page {page}: {response.status_code}")
                break
                
            soup = BeautifulSoup(response.text, 'html.parser')
            # Craigslist structure changes, searching for result-info usually works
            results = soup.find_all('li', class_='cl-static-search-result')
            
            if not results:
                 # Fallback for older/different layouts
                results = soup.find_all('li', class_='result-row')

            if not results:
                print("No results found on page (structure might have changed).")
                # Debug: Print a bit of html
                # print(soup.prettify()[:1000]) 
                break

            for item in results:
                try:
                    # Price
                    price_elem = item.find('div', class_='price')
                    price = price_elem.text.strip().replace('$', '').replace(',', '') if price_elem else None
                    
                    # Title
                    title_elem = item.find('div', class_='title')
                    title = title_elem.text.strip() if title_elem else "N/A"
                    
                    # Housing info (Beds / SqFt) - often roughly structured "2br - 800ft2"
                    details_elem = item.find('div', class_='details')
                    details = details_elem.text.strip() if details_elem else ""

                    # Link
                    link_elem = item.find('a')
                    link = link_elem['href'] if link_elem else None
                    
                    # Location
                    loc_elem = item.find('div', class_='location')
                    location = loc_elem.text.strip().replace('(', '').replace(')', '') if loc_elem else "Unknown"

                    if price:
                        listings.append({
                            'source': 'craigslist',
                            'price': float(price),
                            'title': title,
                            'details': details,
                            'location': location,
                            'url': link
                        })
                except Exception as e:
                    continue
            
            print(f"Collected {len(listings)} listings so far...")
            time.sleep(random.uniform(1.0, 3.0)) # Be nice
            
            if len(listings) >= count:
                break
                
        except Exception as e:
            print(f"Error scraping: {e}")
            break

    df = pd.DataFrame(listings)
    return df

def extract_details(details_str):
    """
    Parses '2br - 950ft2' into {'beds': 2, 'sqft': 950}
    """
    beds = None
    sqft = None
    
    # Extract Beds
    beds_match = re.search(r'(\d+)br', details_str)
    if beds_match:
        beds = int(beds_match.group(1))
    
    # Extract SqFt
    sqft_match = re.search(r'(\d+)ft', details_str)
    if sqft_match:
        sqft = int(sqft_match.group(1))
        
    return beds, sqft

if __name__ == "__main__":
    df = scrape_cl_listings(count=800)
    
    # Post-process to extract numeric beds/sqft
    if not df.empty:
        df[['beds', 'sqft']] = df['details'].apply(lambda x: pd.Series(extract_details(x)))
        out_path = 'd:/Python-2025/Antigravity/Beekin_Analysis/src/data/scrapers/real_listings.csv'
        df.to_csv(out_path, index=False)
        print(f"Scrape Complete. Saved {len(df)} rows to {out_path}")
        print(df.describe())
    else:
        print("Scrape returned no data.")
