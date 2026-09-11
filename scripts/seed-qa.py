#!/usr/bin/env python3
"""Seeds a throwaway account with a trip full enough to judge layouts.

    python3 scripts/seed-qa.py [username]     # backend on :8080, default user qa_rwd

Registers (or signs in) the user with password Qa-pass-12345 and creates one
trip — Northern Thailand, six days — with bookings, places, stops, expenses and
to-dos, then prints the trip and day ids. Everything belongs to that user, so
deleting the user's places, trips and the user itself removes it all again.
"""
import json, urllib.request, sys

B = 'http://localhost:8080'
U = sys.argv[1] if len(sys.argv) > 1 else 'qa_rwd'


def call(method, path, body=None, token=None):
    req = urllib.request.Request(B + path, method=method,
                                 data=json.dumps(body).encode() if body is not None else None)
    if body is not None:
        req.add_header('content-type', 'application/json')
    if token:
        req.add_header('Authorization', 'Bearer ' + token)
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read().decode()
            return json.loads(raw) if raw.strip().startswith(('{', '[')) else raw
    except urllib.error.HTTPError as e:
        print(f'  ! {method} {path} -> {e.code} {e.read().decode()[:120]}')
        return None


tok = (call('POST', '/api/auth/register', {'username': U, 'email': U + '@example.com', 'password': 'Qa-pass-12345'})
       or call('POST', '/api/auth/login', {'username': U, 'password': 'Qa-pass-12345'}))['token']
trip = call('POST', '/api/trips', {'title': 'Northern Thailand & the islands', 'destination': 'Thailand',
                                   'startDate': '2026-12-10', 'endDate': '2026-12-15',
                                   'baseCurrency': 'EUR', 'status': 'PLANNED'}, tok)
t = trip['id']
days = call('GET', f'/api/trips/{t}/days', None, tok)
print('trip', t, 'days', len(days))

bookings = [
 {'name': 'FRA to Chiang Rai', 'category': 'TRANSPORTATION', 'transportMode': 'FLIGHT',
  'fromPlace': 'Frankfurt Airport', 'toPlace': 'Mae Fah Luang - Chiang Rai International Airport',
  'fromLatitude': 50.0379, 'fromLongitude': 8.5622, 'toLatitude': 19.9526, 'toLongitude': 99.8829,
  'departureAt': '2026-12-10T20:55:00', 'arrivalAt': '2026-12-11T18:15:00', 'flightNumber': 'TG 923 & TG 136',
  'seat': '71K, 71J', 'fullPrice': 1840, 'priceCurrency': 'EUR', 'paidSimple': True},
 {'name': 'Nak Nakara Hotel', 'category': 'ACCOMMODATION', 'accommodationCity': 'Chiang Rai',
  'address': '661 Utarakit Road, Chiang Rai', 'latitude': 19.9098, 'longitude': 99.8325,
  'checkIn': '2026-12-11', 'checkOut': '2026-12-13', 'checkInTime': '14:00', 'checkOutTime': '12:00',
  'roomType': 'Deluxe twin', 'guests': 2, 'fullPrice': 118, 'priceCurrency': 'EUR', 'paidSimple': False},
 {'name': 'Car rental · Chiang Rai', 'category': 'TRANSPORTATION', 'transportMode': 'CAR_RENTAL',
  'vendor': 'Thai Rent A Car', 'fromPlace': 'Chiang Rai Airport', 'toPlace': 'Chiang Mai Airport',
  'fromLatitude': 19.9526, 'fromLongitude': 99.8829, 'toLatitude': 18.7692, 'toLongitude': 98.9682,
  'departureAt': '2026-12-11T19:30:00', 'arrivalAt': '2026-12-13T11:00:00', 'carClass': 'SUV',
  'fullPrice': 96, 'priceCurrency': 'EUR', 'paidSimple': False},
 {'name': 'Elephant sanctuary half day', 'category': 'ACTIVITY', 'address': 'Mae Wang, Chiang Mai',
  'latitude': 18.6403, 'longitude': 98.7112, 'departureAt': '2026-12-13T08:30:00',
  'arrivalAt': '2026-12-13T13:00:00', 'fullPrice': 74, 'priceCurrency': 'EUR', 'paidSimple': True},
 {'name': 'Chiang Mai to Krabi', 'category': 'TRANSPORTATION', 'transportMode': 'FLIGHT',
  'fromPlace': 'Chiang Mai International Airport', 'toPlace': 'Krabi International Airport',
  'fromLatitude': 18.7692, 'fromLongitude': 98.9682, 'toLatitude': 8.0993, 'toLongitude': 98.9832,
  'departureAt': '2026-12-14T12:55:00', 'arrivalAt': '2026-12-14T14:20:00', 'flightNumber': 'FD 3178',
  'fullPrice': 63.4, 'priceCurrency': 'EUR', 'paidSimple': True},
 {'name': 'Ao Nang Cliff Beach Resort', 'category': 'ACCOMMODATION', 'accommodationCity': 'Ao Nang',
  'address': '85/2 Moo 2, Ao Nang, Krabi', 'latitude': 8.0324, 'longitude': 98.8226,
  'checkIn': '2026-12-14', 'checkOut': '2026-12-15', 'checkInTime': '15:00', 'checkOutTime': '11:00',
  'roomType': 'Sea view', 'guests': 2, 'fullPrice': 143, 'priceCurrency': 'EUR', 'paidSimple': False},
]
for b in bookings:
    call('POST', f'/api/trips/{t}/bookings', b, tok)
print('bookings', len(call('GET', f'/api/trips/{t}/bookings', None, tok)))

places = [
 ('Wat Rong Khun (White Temple)', 'SIGHTSEEING', 'Chiang Rai', 19.8242, 99.7631, 5, 120),
 ('Wat Rong Suea Ten (Blue Temple)', 'SIGHTSEEING', 'Chiang Rai', 19.9331, 99.8262, 5, 60),
 ('Choui Fong Tea Plantation', 'NATURE', 'Chiang Rai', 20.0709, 99.7259, 4, 90),
 ('Doi Inthanon National Park', 'NATURE', 'Chiang Mai', 18.5886, 98.4867, 5, 300),
 ('Nimman coffee crawl', 'NEIGHBORHOOD', 'Chiang Mai', 18.7961, 98.9673, 3, 120),
 ('Railay Beach', 'BEACH', 'Krabi', 8.0119, 98.8378, 5, 240),
 ('Ao Nang night market', 'SHOP', 'Ao Nang', 8.0333, 98.8215, 3, 60),
]
pids = []
for name, ptype, city, lat, lon, rating, mins in places:
    p = call('POST', '/api/places', {'name': name, 'type': ptype, 'city': city, 'country': 'TH',
                                     'latitude': lat, 'longitude': lon, 'rating': rating,
                                     'visitMinutes': mins, 'visibility': 'PRIVATE',
                                     'description': 'Seeded for layout testing.'}, tok)
    if p:
        pids.append(p['id'])
        call('PUT', f'/api/places/{p["id"]}/trips/{t}', None, tok)
print('places', len(pids))

# a couple of hand-made stops with times, on the second and fourth day
if len(days) > 3:
    call('POST', f'/api/days/{days[1]["id"]}/activities',
         {'name': 'White Temple', 'type': 'SIGHTSEEING', 'startTime': '09:30', 'endTime': '11:30',
          'placeId': pids[0] if pids else None, 'costEstimate': 3.5, 'costCurrency': 'EUR'}, tok)
    call('POST', f'/api/days/{days[1]["id"]}/activities',
         {'name': 'Lunch at the riverside — long name to stress the layout a little',
          'type': 'MEAL_STOP', 'startTime': '12:30', 'costEstimate': 400, 'costCurrency': 'THB'}, tok)
    call('POST', f'/api/days/{days[3]["id"]}/activities',
         {'name': 'Doi Inthanon', 'type': 'NATURE', 'startTime': '08:00', 'endTime': '15:00',
          'placeId': pids[3] if len(pids) > 3 else None}, tok)
    call('POST', f'/api/days/{days[1]["id"]}/expenses',
         {'amount': 62.5, 'currency': 'EUR', 'category': 'FOOD', 'description': 'Dinner + drinks'}, tok)
    call('POST', f'/api/days/{days[2]["id"]}/expenses',
         {'amount': 1200, 'currency': 'THB', 'category': 'TRANSPORT', 'description': 'Songthaew day'}, tok)

call('POST', f'/api/trips/{t}/plan/from-bookings', None, tok)
sug = call('GET', f'/api/trips/{t}/todos/suggestions', None, tok)
if isinstance(sug, list) and sug:
    call('POST', f'/api/trips/{t}/todos/from-suggestions',
         {'keys': [s['key'] for s in sug[:6]]}, tok)
for title, group in [('Book Doi Inthanon driver', 'Before we go'), ('Travel insurance', 'Before we go'),
                     ('Pack reef-safe sunscreen', 'Packing'), ('Download offline maps', 'Packing')]:
    call('POST', f'/api/trips/{t}/todos', {'title': title, 'groupName': group}, tok)
todos = call('GET', f'/api/trips/{t}/todos', None, tok)
print('todos', len(todos) if isinstance(todos, list) else todos)
print('TRIP_ID', t)
print('DAY_IDS', ' '.join(d['id'] for d in days))
