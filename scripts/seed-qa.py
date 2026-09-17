#!/usr/bin/env python3
"""Seeds a throwaway account with one consultant's trip — the trip every check runs on.

    python3 scripts/seed-qa.py [username]     # backend on :8080, default user qa_consultant

Registers (or signs in) the user with password Qa-pass-12345 and builds the trip a travel
consultant would hand to a client: six days plus a reserve day, two hotels, two flights and a
car rental, a payment schedule in three parts (one paid, one overdue, one still ahead), seven
places in three folders, hand-made stops with times and a second currency, the stops generated
from the bookings, and a to-do list. Prints the ids and a summary of what it made.

Everything belongs to that user, so deleting the user's places, trips and the user itself
removes it all again. Re-running against the same username makes a second trip — delete the
old one first, or pass a fresh name.
"""
import json, sys, urllib.error, urllib.request
from datetime import date

B = 'http://localhost:8080'
U = sys.argv[1] if len(sys.argv) > 1 else 'qa_consultant'

# The fiction. The consultant is the account; the client lives in the trip's title until
# stage 3.1 gives Trip its own clientName / clientEmail / clientPhone, and stage 3.2 gives
# the account a logo, a business name and contacts. When those land, set them here instead
# of carrying the client's name in the title.
CONSULTANT = 'Marta Voss Reisen'
CLIENT = 'Familie Ortmann'
TRIP = 'Northern Thailand & the islands'


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
        print(f'  ! {method} {path} -> {e.code} {e.read().decode()[:160]}')
        return None
    except urllib.error.URLError as e:
        sys.exit(f'backend not reachable at {B} ({e.reason}) — start it and try again')


auth = (call('POST', '/api/auth/register', {'username': U, 'email': U + '@example.com', 'password': 'Qa-pass-12345'})
        or call('POST', '/api/auth/login', {'username': U, 'password': 'Qa-pass-12345'}))
if not auth:
    sys.exit('could not register or sign in — is the database up?')
tok = auth['token']

trip = call('POST', '/api/trips', {'title': f'{TRIP} — {CLIENT}', 'destination': 'Thailand',
                                   'startDate': '2026-12-10', 'endDate': '2026-12-15',
                                   'baseCurrency': 'EUR', 'status': 'PLANNED'}, tok)
t = trip['id']
days = call('GET', f'/api/trips/{t}/days', None, tok)
print(f'{CONSULTANT}: trip {t}, {len(days)} days')

bookings = [
 {'name': 'FRA to Chiang Rai', 'category': 'TRANSPORTATION', 'transportMode': 'FLIGHT',
  'fromPlace': 'Frankfurt Airport', 'toPlace': 'Mae Fah Luang - Chiang Rai International Airport',
  'fromLatitude': 50.0379, 'fromLongitude': 8.5622, 'toLatitude': 19.9526, 'toLongitude': 99.8829,
  'departureAt': '2026-12-10T20:55:00', 'arrivalAt': '2026-12-11T18:15:00', 'flightNumber': 'TG 923 & TG 136',
  'seat': '71K, 71J', 'fullPrice': 1840, 'priceCurrency': 'EUR', 'paidSimple': False},
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
made = [call('POST', f'/api/trips/{t}/bookings', b, tok) for b in bookings]
made = [b for b in made if b]
print('bookings', len(made))

# The long-haul flight is paid in three parts and adds up to the full price exactly — the
# deposit is settled, the second part was due a week ago and is not (stage 3.3 marks it
# overdue), the third is still ahead.
flight = made[0]
schedule = [(460, '2026-08-25', True), (690, '2026-09-10', False), (690, '2026-11-20', False)]
for amount, due, paid in schedule:
    after = call('POST', f'/api/bookings/{flight["id"]}/payments', {'amount': amount, 'dueDate': due}, tok)
    if paid and after and after.get('payments'):
        call('PATCH', f'/api/payments/{after["payments"][-1]["id"]}/paid', None, tok)
today = date.today().isoformat()
print(f'payments {len(schedule)} — one paid, one overdue as of {today}, one ahead')

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

# Three folders, so the library has something to drag between. Indices point into `places`.
folders = [('Temples & culture', '#e35a38', [0, 1]),
           ('Nature & parks', '#2f7d5b', [2, 3]),
           ('Krabi & the beaches', '#2b6ca3', [5, 6])]
for name, color, members in folders:
    f = call('POST', '/api/folders', {'name': name, 'color': color, 'tripId': t}, tok)
    for i in members:
        if f and i < len(pids):
            call('PUT', f'/api/folders/{f["id"]}/places/{pids[i]}', None, tok)
print('folders', len(folders))

# Hand-made stops with times, a second currency and a long name, on the second and fourth day.
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

call('POST', f'/api/trips/{t}/plan/from-bookings', None, tok)

# One reserve day with two options on it — what a consultant keeps for bad weather.
after_buffer = call('POST', f'/api/trips/{t}/days/buffer', None, tok) or []
buffer_day = next((d for d in after_buffer if d.get('isBuffer') or d.get('buffer')), None)
if buffer_day:
    call('PATCH', f'/api/days/{buffer_day["id"]}',
         {'city': 'Chiang Rai', 'notes': 'Reserve day — if the weather turns, one of these instead.'}, tok)
    call('POST', f'/api/days/{buffer_day["id"]}/activities',
         {'name': 'Blue Temple', 'type': 'SIGHTSEEING',
          'placeId': pids[1] if len(pids) > 1 else None}, tok)
    call('POST', f'/api/days/{buffer_day["id"]}/activities',
         {'name': 'Choui Fong tea plantation', 'type': 'NATURE',
          'placeId': pids[2] if len(pids) > 2 else None}, tok)
print('reserve day', 'yes' if buffer_day else 'MISSING')

sug = call('GET', f'/api/trips/{t}/todos/suggestions', None, tok)
if isinstance(sug, list) and sug:
    call('POST', f'/api/trips/{t}/todos/from-suggestions', {'keys': [s['key'] for s in sug[:6]]}, tok)
for title, group in [('Book Doi Inthanon driver', 'Before we go'), ('Travel insurance', 'Before we go'),
                     ('Pack reef-safe sunscreen', 'Packing'), ('Download offline maps', 'Packing')]:
    call('POST', f'/api/trips/{t}/todos', {'title': title, 'groupName': group}, tok)
todos = call('GET', f'/api/trips/{t}/todos', None, tok)
print('todos', len(todos) if isinstance(todos, list) else todos)

days = call('GET', f'/api/trips/{t}/days', None, tok) or days
print()
print(f'  user      {U} / Qa-pass-12345')
print(f'  trip      {t}  ({TRIP} — {CLIENT})')
print(f'  days      {" ".join(d["id"] for d in days)}')
print('  not yet   consultant logo & contacts (stage 3.2), client fields on the trip (stage 3.1),')
print('            photos on places (uploads are multipart — add by hand when testing the book)')
