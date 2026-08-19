// Shared India + United States location dictionary. It contains every Indian
// state/union territory and every US state, their capitals, and major hiring hubs.
// Forms may still allow a custom location for any smaller town worldwide.
const INDIA_SUBDIVISIONS: Array<[string, string]> = [
  ["Andhra Pradesh", "Amaravati"], ["Arunachal Pradesh", "Itanagar"], ["Assam", "Dispur"], ["Bihar", "Patna"],
  ["Chhattisgarh", "Raipur"], ["Goa", "Panaji"], ["Gujarat", "Gandhinagar"], ["Haryana", "Chandigarh"],
  ["Himachal Pradesh", "Shimla"], ["Jharkhand", "Ranchi"], ["Karnataka", "Bengaluru"], ["Kerala", "Thiruvananthapuram"],
  ["Madhya Pradesh", "Bhopal"], ["Maharashtra", "Mumbai"], ["Manipur", "Imphal"], ["Meghalaya", "Shillong"],
  ["Mizoram", "Aizawl"], ["Nagaland", "Kohima"], ["Odisha", "Bhubaneswar"], ["Punjab", "Chandigarh"],
  ["Rajasthan", "Jaipur"], ["Sikkim", "Gangtok"], ["Tamil Nadu", "Chennai"], ["Telangana", "Hyderabad"],
  ["Tripura", "Agartala"], ["Uttar Pradesh", "Lucknow"], ["Uttarakhand", "Dehradun"], ["West Bengal", "Kolkata"],
  ["Andaman and Nicobar Islands", "Port Blair"], ["Chandigarh", "Chandigarh"], ["Dadra and Nagar Haveli and Daman and Diu", "Daman"],
  ["Delhi", "New Delhi"], ["Jammu and Kashmir", "Srinagar"], ["Ladakh", "Leh"], ["Lakshadweep", "Kavaratti"], ["Puducherry", "Puducherry"],
];

const INDIA_HIRING_HUBS = [
  "Bangalore, Karnataka, India", "Mysore, Karnataka, India", "Hubli, Karnataka, India", "Hyderabad, Telangana, India",
  "Pune, Maharashtra, India", "Mumbai, Maharashtra, India", "Nagpur, Maharashtra, India", "Nashik, Maharashtra, India",
  "Chennai, Tamil Nadu, India", "Coimbatore, Tamil Nadu, India", "Madurai, Tamil Nadu, India", "Gurgaon, Haryana, India",
  "Faridabad, Haryana, India", "Noida, Uttar Pradesh, India", "Ghaziabad, Uttar Pradesh, India", "Kanpur, Uttar Pradesh, India",
  "Varanasi, Uttar Pradesh, India", "Delhi, India", "Kolkata, West Bengal, India", "Ahmedabad, Gujarat, India",
  "Surat, Gujarat, India", "Vadodara, Gujarat, India", "Jaipur, Rajasthan, India", "Indore, Madhya Pradesh, India",
  "Bhopal, Madhya Pradesh, India", "Kochi, Kerala, India", "Thiruvananthapuram, Kerala, India", "Visakhapatnam, Andhra Pradesh, India",
  "Vijayawada, Andhra Pradesh, India", "Bhubaneswar, Odisha, India", "Chandigarh, India", "Mohali, Punjab, India",
  "Patna, Bihar, India", "Ranchi, Jharkhand, India", "Guwahati, Assam, India", "Siliguri, West Bengal, India",
];

const US_STATES: Array<[string, string]> = [
  ["Alabama", "Montgomery"], ["Alaska", "Juneau"], ["Arizona", "Phoenix"], ["Arkansas", "Little Rock"], ["California", "Sacramento"],
  ["Colorado", "Denver"], ["Connecticut", "Hartford"], ["Delaware", "Dover"], ["Florida", "Tallahassee"], ["Georgia", "Atlanta"],
  ["Hawaii", "Honolulu"], ["Idaho", "Boise"], ["Illinois", "Springfield"], ["Indiana", "Indianapolis"], ["Iowa", "Des Moines"],
  ["Kansas", "Topeka"], ["Kentucky", "Frankfort"], ["Louisiana", "Baton Rouge"], ["Maine", "Augusta"], ["Maryland", "Annapolis"],
  ["Massachusetts", "Boston"], ["Michigan", "Lansing"], ["Minnesota", "Saint Paul"], ["Mississippi", "Jackson"], ["Missouri", "Jefferson City"],
  ["Montana", "Helena"], ["Nebraska", "Lincoln"], ["Nevada", "Carson City"], ["New Hampshire", "Concord"], ["New Jersey", "Trenton"],
  ["New Mexico", "Santa Fe"], ["New York", "Albany"], ["North Carolina", "Raleigh"], ["North Dakota", "Bismarck"], ["Ohio", "Columbus"],
  ["Oklahoma", "Oklahoma City"], ["Oregon", "Salem"], ["Pennsylvania", "Harrisburg"], ["Rhode Island", "Providence"], ["South Carolina", "Columbia"],
  ["South Dakota", "Pierre"], ["Tennessee", "Nashville"], ["Texas", "Austin"], ["Utah", "Salt Lake City"], ["Vermont", "Montpelier"],
  ["Virginia", "Richmond"], ["Washington", "Olympia"], ["West Virginia", "Charleston"], ["Wisconsin", "Madison"], ["Wyoming", "Cheyenne"],
];

const US_HIRING_HUBS = [
  "New York, New York, USA", "Buffalo, New York, USA", "San Francisco, California, USA", "San Jose, California, USA", "Los Angeles, California, USA",
  "San Diego, California, USA", "Seattle, Washington, USA", "Bellevue, Washington, USA", "Austin, Texas, USA", "Dallas, Texas, USA",
  "Houston, Texas, USA", "Chicago, Illinois, USA", "Boston, Massachusetts, USA", "Cambridge, Massachusetts, USA", "Miami, Florida, USA",
  "Orlando, Florida, USA", "Atlanta, Georgia, USA", "Denver, Colorado, USA", "Washington, District of Columbia, USA", "Arlington, Virginia, USA",
  "Philadelphia, Pennsylvania, USA", "Pittsburgh, Pennsylvania, USA", "Portland, Oregon, USA", "Minneapolis, Minnesota, USA", "Detroit, Michigan, USA",
  "Charlotte, North Carolina, USA", "Raleigh, North Carolina, USA", "Nashville, Tennessee, USA", "Phoenix, Arizona, USA", "Las Vegas, Nevada, USA",
];

export const INDIA_US_LOCATION_MASTER = Array.from(new Set([
  ...INDIA_SUBDIVISIONS.flatMap(([state, capital]) => [`${capital}, ${state}, India`, `${state}, India`]),
  ...INDIA_HIRING_HUBS,
  ...US_STATES.flatMap(([state, capital]) => [`${capital}, ${state}, USA`, `${state}, USA`]),
  "Washington, District of Columbia, USA",
  ...US_HIRING_HUBS,
])).sort((a, b) => a.localeCompare(b));
