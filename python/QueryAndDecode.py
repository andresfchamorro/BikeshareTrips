import csv
import googlemaps
import json
import jsonpickle
from datetime import datetime
import time
import polyline

gmaps = googlemaps.Client(key='AIzaSyCLpq4hRY9QHGGMFV4jKDRO0oDDHSk6RrY')
region = '.us'
alternatives = False
try:
    with open('Trips_Oct1_Less30_2.csv', 'rb') as csvfile:
        spamreader = csv.reader(csvfile, delimiter=',')
        rownum = 0
        array = []
        for row in spamreader:
            if rownum==0:
                header = row
            else:
                start = row[11]
                end = row[12]
                starttime = row[1]
                duration = row[9]

                # Request directions via public transit
                if rownum % 500 == 0:
                    time.sleep(60)
                if rownum % 10 == 0:
                    time.sleep(10)
                directions_result = gmaps.directions(start,
                                                     end,
                                                     mode="bicycling",
                                                     alternatives=False,
                                                     region='.us')
                if (len(directions_result)>0):
                    res = directions_result[0]['overview_polyline']['points']
                    decoded = polyline.decode(res)
                    array.append([rownum,decoded,starttime,duration])
                    print("finished" + str(rownum))
                else:
                    print("couldn't do " + str(rownum))
            rownum += 1

    with open('Oct1_Trips_2.json', 'w') as outfile:
        json.dump(array, outfile, sort_keys=True, indent=1, separators=(',', ': '))

except googlemaps.exceptions.ApiError as err :
    print(err)
