export interface AthleteProfile {
  id: string;
  name: string;
  sport: string;
  level: 'Professional' | 'College' | 'High School' | 'Amateur' | 'Youth';
  location: string;
  bio: string;
  achievements: string[];
  personalBests: Record<string, string>;
  profilePicture: string;
  followers: number;
  following: number;
  posts: number;
  verified: boolean;
  teamAffiliation?: string;
  coachName?: string;
  yearsExperience: number;
  specialties: string[];
}

export const demoAthletes: AthleteProfile[] = [
  {
    id: 'sarah_johnson',
    name: 'Sarah Johnson',
    sport: 'Track & Field (Sprint)',
    level: 'College',
    location: 'Austin, TX',
    bio: 'Division I sprinter at University of Texas. Chasing dreams one stride at a time. Sub-11 100m is the goal! 🏃‍♀️⚡',
    achievements: [
      'Big 12 Conference 100m Champion (2023)',
      'NCAA Division I Semifinals Qualifier',
      'High School State Champion 100m/200m',
      'Regional Record Holder (100m - 11.15s)'
    ],
    personalBests: {
      '100m': '11.15s',
      '200m': '22.87s',
      '60m (Indoor)': '7.23s',
      'Long Jump': '6.12m'
    },
    profilePicture: '',
    followers: 2847,
    following: 523,
    posts: 127,
    verified: true,
    teamAffiliation: 'University of Texas Longhorns',
    coachName: 'Coach Martinez',
    yearsExperience: 8,
    specialties: ['Sprint Starts', 'Speed Endurance', 'Mental Preparation']
  },
  {
    id: 'mike_chen',
    name: 'Mike Chen',
    sport: 'Multi-Sport Fitness',
    level: 'Amateur',
    location: 'San Francisco, CA',
    bio: 'Fitness enthusiast exploring the science of performance. Believer in balance, recovery, and mindful training. 🧘‍♂️💪',
    achievements: [
      'Local CrossFit Competition Finalist',
      'San Francisco Marathon Finisher (3:15)',
      'Certified Personal Trainer (NASM)',
      'Spartan Race Trifecta Finisher'
    ],
    personalBests: {
      'Marathon': '3:15:22',
      'Half Marathon': '1:28:45',
      '5K': '18:32',
      'Deadlift': '425lbs',
      'Bench Press': '285lbs',
      'Back Squat': '365lbs'
    },
    profilePicture: '',
    followers: 1923,
    following: 891,
    posts: 203,
    verified: false,
    yearsExperience: 6,
    specialties: ['Recovery Methods', 'Functional Training', 'Nutrition Planning']
  },
  {
    id: 'alex_rivera',
    name: 'Alex Rivera',
    sport: 'Basketball',
    level: 'High School',
    location: 'Chicago, IL',
    bio: 'Senior point guard leading my team to state championships. Basketball is life! 🏀 Next stop: Division I scholarship.',
    achievements: [
      'All-State First Team Selection',
      'Regional Tournament MVP',
      'School Record: Most Assists in a Season (247)',
      'Team Captain (2 years)'
    ],
    personalBests: {
      'Points per Game': '18.5 avg',
      'Assists per Game': '12.1 avg',
      'Free Throw %': '89.2%',
      '3-Point %': '41.7%',
      'Single Game Assists': '19'
    },
    profilePicture: '',
    followers: 3156,
    following: 412,
    posts: 89,
    verified: false,
    teamAffiliation: 'Lincoln High Eagles',
    coachName: 'Coach Thompson',
    yearsExperience: 10,
    specialties: ['Point Guard Leadership', 'Court Vision', 'Fast Break Offense']
  },
  {
    id: 'emma_wilson',
    name: 'Emma Wilson',
    sport: 'Swimming',
    level: 'College',
    location: 'Stanford, CA',
    bio: 'Stanford swimmer specializing in distance freestyle. Early morning pool sessions fuel my dreams! 🏊‍♀️🌅',
    achievements: [
      'Pac-12 Conference 1500m Freestyle Champion',
      'NCAA Division I All-American (2x)',
      'U.S. National Championships Qualifier',
      'Olympic Trials Qualifier (1500m Free)'
    ],
    personalBests: {
      '1500m Freestyle': '15:42.18',
      '800m Freestyle': '8:18.54',
      '400m Freestyle': '4:02.91',
      '400m IM': '4:28.13',
      '200m Freestyle': '1:56.77'
    },
    profilePicture: '',
    followers: 4203,
    following: 673,
    posts: 156,
    verified: true,
    teamAffiliation: 'Stanford Cardinal',
    coachName: 'Coach Anderson',
    yearsExperience: 12,
    specialties: ['Distance Training', 'Stroke Technique', 'Mental Toughness']
  },
  {
    id: 'jordan_smith',
    name: 'Jordan Smith',
    sport: 'Soccer',
    level: 'Professional',
    location: 'Portland, OR',
    bio: 'Professional midfielder for Portland Timbers. Captain, leader, and passionate about the beautiful game ⚽🌹',
    achievements: [
      'MLS Cup Finalist (2022)',
      'MLS All-Star Team Selection',
      'Team Captain (3 years)',
      'Supporters Shield Winner',
      'USL Championship MVP (2019)'
    ],
    personalBests: {
      'Goals (Season)': '12 goals',
      'Assists (Season)': '15 assists',
      'Pass Accuracy': '89.3%',
      'Distance Covered': '11.2 km/match avg',
      'Career Goals': '47 goals'
    },
    profilePicture: '',
    followers: 15847,
    following: 289,
    posts: 234,
    verified: true,
    teamAffiliation: 'Portland Timbers',
    coachName: 'Coach Rodriguez',
    yearsExperience: 15,
    specialties: ['Midfield Playmaking', 'Set Pieces', 'Team Leadership']
  },
  {
    id: 'tyler_brooks',
    name: 'Tyler Brooks',
    sport: 'Powerlifting',
    level: 'Amateur',
    location: 'Denver, CO',
    bio: 'Strength athlete focused on the big three: squat, bench, deadlift. Mind over matter, every single rep! 🏋️‍♂️💯',
    achievements: [
      'Colorado State Powerlifting Champion',
      'USAPL Regional Qualifier',
      'Raw National Championships Competitor',
      '500+ Wilks Score Achiever'
    ],
    personalBests: {
      'Squat': '485 lbs',
      'Bench Press': '325 lbs',
      'Deadlift': '565 lbs',
      'Total': '1375 lbs',
      'Wilks Score': '502.3'
    },
    profilePicture: '',
    followers: 1456,
    following: 734,
    posts: 178,
    verified: false,
    yearsExperience: 7,
    specialties: ['Progressive Overload', 'Form Analysis', 'Competition Prep']
  },
  {
    id: 'maya_patel',
    name: 'Maya Patel',
    sport: 'Marathon Running',
    level: 'Amateur',
    location: 'Boston, MA',
    bio: 'Distance runner chasing Boston qualification times. Every mile tells a story. 26.2 is my favorite number! 🏃‍♀️🇺🇸',
    achievements: [
      'Boston Marathon Qualifier (3 times)',
      'New York City Marathon Finisher',
      'Local Half Marathon Champion',
      'Sub-3 Hour Marathoner'
    ],
    personalBests: {
      'Marathon': '2:52:18',
      'Half Marathon': '1:18:45',
      '10K': '36:42',
      '5K': '17:28',
      'Mile': '5:15'
    },
    profilePicture: '',
    followers: 2734,
    following: 1092,
    posts: 267,
    verified: false,
    yearsExperience: 9,
    specialties: ['Endurance Training', 'Race Strategy', 'Injury Prevention']
  },
  {
    id: 'carlos_mendez',
    name: 'Carlos Mendez',
    sport: 'Boxing',
    level: 'Amateur',
    location: 'Las Vegas, NV',
    bio: 'Amateur boxer with Olympic dreams. Every round is a lesson, every fight is a story. Stay hungry! 🥊🔥',
    achievements: [
      'Golden Gloves Regional Champion',
      'National Amateur Championships Semifinalist',
      'Olympic Training Center Invitee',
      'USA Boxing Ranked (Top 10)'
    ],
    personalBests: {
      'Amateur Record': '23-3',
      'KO Percentage': '45%',
      'Weight Class': 'Light Heavyweight',
      'Tournament Wins': '12',
      'Sparring Rounds': '500+ rounds'
    },
    profilePicture: '',
    followers: 1876,
    following: 445,
    posts: 134,
    verified: false,
    teamAffiliation: 'Las Vegas Boxing Academy',
    coachName: 'Trainer Garcia',
    yearsExperience: 8,
    specialties: ['Counter-Punching', 'Footwork', 'Ring Psychology']
  }
];

export const demoCoaches = [
  {
    id: 'coach_martinez',
    name: 'Coach Martinez',
    specialty: 'Sprint Training',
    experience: 15,
    athletes: ['sarah_johnson']
  },
  {
    id: 'coach_thompson',
    name: 'Coach Thompson',
    specialty: 'Basketball Development',
    experience: 22,
    athletes: ['alex_rivera']
  },
  {
    id: 'coach_anderson',
    name: 'Coach Anderson',
    specialty: 'Distance Swimming',
    experience: 18,
    athletes: ['emma_wilson']
  },
  {
    id: 'coach_rodriguez',
    name: 'Coach Rodriguez',
    specialty: 'Soccer Tactics',
    experience: 25,
    athletes: ['jordan_smith']
  },
  {
    id: 'trainer_garcia',
    name: 'Trainer Garcia',
    specialty: 'Boxing Training',
    experience: 20,
    athletes: ['carlos_mendez']
  }
];

export const motivationalQuotes = [
  "Champions aren't made in the gyms. Champions are made from something deep inside them - a desire, a dream, a vision.",
  "The only impossible journey is the one you never begin.",
  "Success isn't given. It's earned in the gym, on the field, in every quiet moment when you choose to push forward.",
  "Your body can stand almost anything. It's your mind that you have to convince.",
  "The difference between ordinary and extraordinary is that little extra.",
  "Every champion was once a contender who refused to give up.",
  "Train like you're second best, perform like you're the best.",
  "The pain you feel today will be the strength you feel tomorrow."
];

export const sportsCategories = [
  'Track & Field',
  'Swimming',
  'Basketball',
  'Soccer',
  'Football',
  'Tennis',
  'Baseball',
  'Volleyball',
  'Wrestling',
  'Boxing',
  'Powerlifting',
  'CrossFit',
  'Marathon Running',
  'Cycling',
  'Gymnastics',
  'Martial Arts',
  'Hockey',
  'Golf'
];
