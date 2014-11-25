from datetime import date
import requests

FRED_API_KEY = "ced316f0b3196133c55f5febd1003f88"
resturl = "http://api.stlouisfed.org/fred/series/observations"
startdate = "1998-01-01"
enddate = "2013-01-01"

def annualInflation(startyear, endyear):
    today = date.today()
    if today.year == endyear:
        latest = today.replace(month=today.month -1)
        latestdatestring = latest.strftime('%Y-%m-%d')

    params = {"api_key": FRED_API_KEY,
              "series_id": "CPIAUCSL",
              "observation_start": startdate,
              "observation_end": enddate,
              "aggregation_method": "avg",
              "frequency": "a",
              "file_type": "json"}
    params2 = params.copy()
    params2['observation_start'] = latestdatestring
    del params2['observation_end']
    params2['frequency'] = 'm'
    historicresponse = requests.get(resturl, params=params)
    latestresponse = requests.get(resturl, params=params2)
    
    historicjson = historicresponse.json()['observations']
    latestjson = latestresponse.json()['observations']
