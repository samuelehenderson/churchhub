// Sample data — replace with API/database calls when backend is ready.
// Each church has a stable id; tags drive search, filters, and the match quiz.

export const churches = [
  {
    id: 'grace-harbor-seattle',
    name: 'Grace Harbor Church',
    city: 'Seattle',
    state: 'WA',
    denomination: 'Non-denominational',
    size: 'large',
    description:
      'A coastal congregation focused on Bible teaching, modern worship, and serving the Puget Sound community.',
    address: '1450 Harbor Way, Seattle, WA 98101',
    lat: 47.6062,
    lng: -122.3321,
    serviceTimes: ['Sun 9:00 AM', 'Sun 11:00 AM', 'Wed 7:00 PM'],
    online: true,
    isLive: true,
    liveTitle: 'Sunday Morning — “Anchored in Hope”',
    // Auto-live: this URL always shows whatever the channel is currently broadcasting.
    // (Channel ID format: youtube.com/embed/live_stream?channel=CHANNEL_ID)
    liveChannelUrl: 'https://www.youtube.com/channel/UCSJ4gkVC6NrvII8umztf0Ow',
    // Fallback video shown when not live (latest sermon / welcome video).
    livestreamUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk',
    sermonVideos: [
      { title: 'Anchored in Hope', date: 'Apr 21, 2026', url: 'https://www.youtube.com/embed/jfKfPfyJRdk' },
      { title: 'The Cost of Following', date: 'Apr 14, 2026', url: 'https://www.youtube.com/embed/jfKfPfyJRdk' },
      { title: 'Quiet Waters', date: 'Apr 7, 2026', url: 'https://www.youtube.com/embed/jfKfPfyJRdk' }
    ],
    tags: ['Modern Worship', 'Bible Teaching', 'Youth Ministry', 'Small Groups', 'Kids Ministry', 'New Believer Friendly'],
    ministries: ['Kids Ministry', 'Youth Ministry', 'Small Groups', 'Marriage Counseling', 'Recovery Group'],
    contact: { phone: '(206) 555-0142', email: 'hello@graceharbor.example' },
    website: 'https://graceharbor.example',
    socials: { youtube: '#', facebook: '#', instagram: '#' },
    logoColor: '#2d6a8a'
  },
  {
    id: 'st-marks-cathedral-boston',
    name: "St. Mark's Cathedral",
    city: 'Boston',
    state: 'MA',
    denomination: 'Episcopal',
    size: 'medium',
    description:
      'A historic downtown parish with traditional liturgy, choral music, and a rhythm of daily prayer.',
    address: '88 Beacon St, Boston, MA 02108',
    lat: 42.3601,
    lng: -71.0589,
    serviceTimes: ['Sun 8:00 AM', 'Sun 10:30 AM', 'Wed 12:10 PM'],
    online: true,
    isLive: false,
    liveTitle: null,
    livestreamUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk',
    sermonVideos: [
      { title: 'The Good Shepherd', date: 'Apr 21, 2026', url: 'https://www.youtube.com/embed/jfKfPfyJRdk' },
      { title: 'Easter Vigil Homily', date: 'Apr 4, 2026', url: 'https://www.youtube.com/embed/jfKfPfyJRdk' }
    ],
    tags: ['Traditional', 'Liturgical', 'Choral Music', 'Small Groups', 'Counseling'],
    ministries: ['Choir', 'Daily Prayer', 'Grief Support', 'Community Meals'],
    contact: { phone: '(617) 555-0188', email: 'office@stmarks.example' },
    website: 'https://stmarks.example',
    socials: { youtube: '#', facebook: '#' },
    logoColor: '#6b3e2e'
  },
  {
    id: 'new-life-fellowship-austin',
    name: 'New Life Fellowship',
    city: 'Austin',
    state: 'TX',
    denomination: 'Baptist',
    size: 'large',
    description:
      'A vibrant family church with bold worship, expository preaching, and a heart for new believers.',
    address: '7200 Music Ln, Austin, TX 78704',
    lat: 30.2672,
    lng: -97.7431,
    serviceTimes: ['Sun 9:30 AM', 'Sun 11:15 AM', 'Sun 6:00 PM'],
    online: true,
    isLive: true,
    liveTitle: 'Live: Sunday Night Worship',
    livestreamUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk',
    sermonVideos: [
      { title: 'Romans Pt. 12 — Living Sacrifice', date: 'Apr 20, 2026', url: 'https://www.youtube.com/embed/jfKfPfyJRdk' },
      { title: 'Why the Resurrection Still Matters', date: 'Apr 6, 2026', url: 'https://www.youtube.com/embed/jfKfPfyJRdk' }
    ],
    tags: ['Modern Worship', 'Bible Teaching', 'Youth Ministry', 'Kids Ministry', 'New Believer Friendly', 'Small Groups'],
    ministries: ['Kids Ministry', 'Youth Ministry', 'College Ministry', 'Small Groups', 'Addiction Recovery'],
    contact: { phone: '(512) 555-0177', email: 'connect@newlifeatx.example' },
    website: 'https://newlifeatx.example',
    socials: { youtube: '#', facebook: '#', instagram: '#' },
    logoColor: '#c87533'
  },
  {
    id: 'cornerstone-chapel-denver',
    name: 'Cornerstone Chapel',
    city: 'Denver',
    state: 'CO',
    denomination: 'Presbyterian',
    size: 'medium',
    description:
      'A reformed congregation in the foothills with thoughtful teaching, hymns, and a robust counseling ministry.',
    address: '305 Mountain View Rd, Denver, CO 80202',
    lat: 39.7392,
    lng: -104.9903,
    serviceTimes: ['Sun 9:00 AM', 'Sun 10:45 AM'],
    online: true,
    isLive: false,
    liveTitle: null,
    livestreamUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk',
    sermonVideos: [
      { title: 'The Beatitudes — Blessed are the Meek', date: 'Apr 21, 2026', url: 'https://www.youtube.com/embed/jfKfPfyJRdk' }
    ],
    tags: ['Mixed Worship', 'Bible Teaching', 'Counseling', 'Small Groups', 'Kids Ministry'],
    ministries: ['Kids Ministry', 'Biblical Counseling', 'Marriage Ministry', 'Small Groups'],
    contact: { phone: '(303) 555-0119', email: 'info@cornerstonedenver.example' },
    website: 'https://cornerstonedenver.example',
    socials: { youtube: '#', facebook: '#' },
    logoColor: '#3d5a3d'
  },
  {
    id: 'living-waters-miami',
    name: 'Living Waters Community Church',
    city: 'Miami',
    state: 'FL',
    denomination: 'Pentecostal',
    size: 'large',
    description:
      'A bilingual, Spirit-filled church with passionate worship and a strong outreach to families across South Florida.',
    address: '2100 Biscayne Blvd, Miami, FL 33137',
    lat: 25.7617,
    lng: -80.1918,
    serviceTimes: ['Sun 9:00 AM (EN)', 'Sun 11:30 AM (ES)', 'Fri 7:30 PM'],
    online: true,
    isLive: true,
    liveTitle: 'Viernes de Adoración — Live Now',
    livestreamUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk',
    sermonVideos: [
      { title: 'Rivers of Life', date: 'Apr 19, 2026', url: 'https://www.youtube.com/embed/jfKfPfyJRdk' },
      { title: 'Walking in Faith', date: 'Apr 12, 2026', url: 'https://www.youtube.com/embed/jfKfPfyJRdk' }
    ],
    tags: ['Modern Worship', 'Bilingual', 'Youth Ministry', 'Kids Ministry', 'New Believer Friendly'],
    ministries: ['Kids Ministry', 'Youth Ministry', 'Spanish Ministry', 'Prayer Team', 'Community Outreach'],
    contact: { phone: '(305) 555-0166', email: 'hola@livingwatersmia.example' },
    website: 'https://livingwatersmia.example',
    socials: { youtube: '#', facebook: '#', instagram: '#' },
    logoColor: '#0e7c7b'
  },
  {
    id: 'redeemer-city-nyc',
    name: 'Redeemer City Church',
    city: 'New York',
    state: 'NY',
    denomination: 'Non-denominational',
    size: 'large',
    description:
      'A Manhattan church for skeptics, seekers, and lifelong believers — known for thoughtful teaching and city-focused mission.',
    address: '210 W 83rd St, New York, NY 10024',
    lat: 40.7128,
    lng: -74.006,
    serviceTimes: ['Sun 9:30 AM', 'Sun 11:15 AM', 'Sun 5:00 PM'],
    online: true,
    isLive: false,
    liveTitle: null,
    livestreamUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk',
    sermonVideos: [
      { title: 'The Prodigal God', date: 'Apr 21, 2026', url: 'https://www.youtube.com/embed/jfKfPfyJRdk' },
      { title: 'Work and Rest', date: 'Apr 14, 2026', url: 'https://www.youtube.com/embed/jfKfPfyJRdk' }
    ],
    tags: ['Mixed Worship', 'Bible Teaching', 'Small Groups', 'New Believer Friendly', 'Counseling'],
    ministries: ['Small Groups', 'Counseling', 'Vocation Ministry', 'Mercy Ministry', 'Kids Ministry'],
    contact: { phone: '(212) 555-0144', email: 'hello@redeemercity.example' },
    website: 'https://redeemercity.example',
    socials: { youtube: '#', facebook: '#', instagram: '#' },
    logoColor: '#1a3a52'
  },
  {
    id: 'mountain-light-asheville',
    name: 'Mountain Light Fellowship',
    city: 'Asheville',
    state: 'NC',
    denomination: 'Methodist',
    size: 'small',
    description:
      'A small mountain church with warm hospitality, acoustic worship, and tight-knit small groups.',
    address: '54 Ridgeline Rd, Asheville, NC 28801',
    lat: 35.5951,
    lng: -82.5515,
    serviceTimes: ['Sun 10:00 AM'],
    online: true,
    isLive: false,
    liveTitle: null,
    livestreamUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk',
    sermonVideos: [
      { title: 'Be Still', date: 'Apr 21, 2026', url: 'https://www.youtube.com/embed/jfKfPfyJRdk' }
    ],
    tags: ['Mixed Worship', 'Small Groups', 'Counseling', 'New Believer Friendly'],
    ministries: ['Small Groups', 'Grief Support', 'Hospitality', 'Mountain Outreach'],
    contact: { phone: '(828) 555-0122', email: 'info@mountainlight.example' },
    website: 'https://mountainlight.example',
    socials: { facebook: '#', instagram: '#' },
    logoColor: '#7a8d5a'
  },
  {
    id: 'open-door-online',
    name: 'Open Door Online Church',
    city: 'Online',
    state: 'US',
    denomination: 'Non-denominational',
    size: 'large',
    description:
      'A fully online congregation built for people who can\'t make it to a building — with live chat hosts, virtual prayer, and weekly small groups over video.',
    address: 'Online — gather from anywhere',
    lat: 39.8283,
    lng: -98.5795,
    serviceTimes: ['Sun 10:00 AM ET', 'Sun 7:00 PM ET', 'Wed 8:00 PM ET'],
    online: true,
    isLive: true,
    liveTitle: 'Open Door Live — Sunday Evening',
    livestreamUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk',
    sermonVideos: [
      { title: 'Everyone Welcome', date: 'Apr 21, 2026', url: 'https://www.youtube.com/embed/jfKfPfyJRdk' },
      { title: 'Faith Online and Offline', date: 'Apr 14, 2026', url: 'https://www.youtube.com/embed/jfKfPfyJRdk' },
      { title: 'When Church Feels Hard', date: 'Apr 7, 2026', url: 'https://www.youtube.com/embed/jfKfPfyJRdk' }
    ],
    tags: ['Modern Worship', 'Online Only', 'Small Groups', 'New Believer Friendly', 'Counseling'],
    ministries: ['Virtual Small Groups', 'Online Prayer Team', 'Recovery Group', 'New Believer Coaching'],
    contact: { phone: '(800) 555-0100', email: 'hello@opendoor.example' },
    website: 'https://opendoor.example',
    socials: { youtube: '#', facebook: '#', instagram: '#' },
    logoColor: '#d4a857'
  }
];

export const allTags = [
  'Modern Worship',
  'Traditional',
  'Mixed Worship',
  'Liturgical',
  'Bible Teaching',
  'Choral Music',
  'Bilingual',
  'Youth Ministry',
  'Kids Ministry',
  'Small Groups',
  'Counseling',
  'New Believer Friendly',
  'Online Only'
];

export const allStates = [...new Set(churches.map((c) => c.state))].sort();
export const allDenominations = [...new Set(churches.map((c) => c.denomination))].sort();
