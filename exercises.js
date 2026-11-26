// Baza ćwiczeń: partia mięśniowa → lista { pl, en, eq }
// eq: sprzęt (sztanga, hantle, maszyna, wyciąg, masa ciała, kettlebell)
window.EXERCISE_DB = [
  { group: 'Klatka piersiowa', en: 'Chest', items: [
    { pl: 'Wyciskanie sztangi na ławce', en: 'Barbell Bench Press', eq: 'sztanga' },
    { pl: 'Wyciskanie sztangi na ławce skośnej', en: 'Incline Barbell Bench Press', eq: 'sztanga' },
    { pl: 'Wyciskanie hantli na ławce', en: 'Dumbbell Bench Press', eq: 'hantle' },
    { pl: 'Wyciskanie hantli na ławce skośnej', en: 'Incline Dumbbell Press', eq: 'hantle' },
    { pl: 'Rozpiętki z hantlami', en: 'Dumbbell Fly', eq: 'hantle' },
    { pl: 'Krzyżowanie linek wyciągu', en: 'Cable Crossover', eq: 'wyciąg' },
    { pl: 'Wyciskanie na maszynie', en: 'Machine Chest Press', eq: 'maszyna' },
    { pl: 'Pompki', en: 'Push-up', eq: 'masa ciała' },
    { pl: 'Pompki na poręczach', en: 'Dips', eq: 'masa ciała' }
  ]},
  { group: 'Plecy', en: 'Back', items: [
    { pl: 'Martwy ciąg', en: 'Deadlift', eq: 'sztanga' },
    { pl: 'Podciąganie na drążku', en: 'Pull-up', eq: 'masa ciała' },
    { pl: 'Podciąganie podchwytem', en: 'Chin-up', eq: 'masa ciała' },
    { pl: 'Wiosłowanie sztangą', en: 'Barbell Row', eq: 'sztanga' },
    { pl: 'Wiosłowanie hantlem jednorącz', en: 'One-Arm Dumbbell Row', eq: 'hantle' },
    { pl: 'Ściąganie drążka wyciągu do klatki', en: 'Lat Pulldown', eq: 'wyciąg' },
    { pl: 'Wiosłowanie na wyciągu siedząc', en: 'Seated Cable Row', eq: 'wyciąg' },
    { pl: 'Wiosłowanie T-sztangą', en: 'T-Bar Row', eq: 'sztanga' },
    { pl: 'Prostowanie tułowia na ławce rzymskiej', en: 'Back Extension', eq: 'masa ciała' },
    { pl: 'Szrugsy ze sztangą', en: 'Barbell Shrug', eq: 'sztanga' }
  ]},
  { group: 'Barki', en: 'Shoulders', items: [
    { pl: 'Wyciskanie żołnierskie', en: 'Overhead Press', eq: 'sztanga' },
    { pl: 'Wyciskanie hantli nad głowę', en: 'Dumbbell Shoulder Press', eq: 'hantle' },
    { pl: 'Arnoldki', en: 'Arnold Press', eq: 'hantle' },
    { pl: 'Unoszenie hantli bokiem', en: 'Lateral Raise', eq: 'hantle' },
    { pl: 'Unoszenie hantli przodem', en: 'Front Raise', eq: 'hantle' },
    { pl: 'Odwrotne rozpiętki', en: 'Reverse Fly', eq: 'hantle' },
    { pl: 'Face pull', en: 'Face Pull', eq: 'wyciąg' },
    { pl: 'Podciąganie sztangi wzdłuż tułowia', en: 'Upright Row', eq: 'sztanga' }
  ]},
  { group: 'Biceps', en: 'Biceps', items: [
    { pl: 'Uginanie ramion ze sztangą', en: 'Barbell Curl', eq: 'sztanga' },
    { pl: 'Uginanie ramion z hantlami', en: 'Dumbbell Curl', eq: 'hantle' },
    { pl: 'Uginanie młotkowe', en: 'Hammer Curl', eq: 'hantle' },
    { pl: 'Uginanie na modlitewniku', en: 'Preacher Curl', eq: 'sztanga' },
    { pl: 'Uginanie na wyciągu', en: 'Cable Curl', eq: 'wyciąg' },
    { pl: 'Uginanie skoncentrowane', en: 'Concentration Curl', eq: 'hantle' }
  ]},
  { group: 'Triceps', en: 'Triceps', items: [
    { pl: 'Wyciskanie francuskie', en: 'Skull Crusher', eq: 'sztanga' },
    { pl: 'Prostowanie ramion na wyciągu', en: 'Triceps Pushdown', eq: 'wyciąg' },
    { pl: 'Wyciskanie wąsko na ławce', en: 'Close-Grip Bench Press', eq: 'sztanga' },
    { pl: 'Prostowanie ramienia z hantlem nad głową', en: 'Overhead Triceps Extension', eq: 'hantle' },
    { pl: 'Pompki w podporze tyłem', en: 'Bench Dips', eq: 'masa ciała' }
  ]},
  { group: 'Przedramiona', en: 'Forearms', items: [
    { pl: 'Uginanie nadgarstków', en: 'Wrist Curl', eq: 'sztanga' },
    { pl: 'Spacer farmera', en: "Farmer's Walk", eq: 'hantle' },
    { pl: 'Zwis na drążku', en: 'Dead Hang', eq: 'masa ciała' }
  ]},
  { group: 'Uda (czworogłowe)', en: 'Quads', items: [
    { pl: 'Przysiad ze sztangą', en: 'Back Squat', eq: 'sztanga' },
    { pl: 'Przysiad przedni', en: 'Front Squat', eq: 'sztanga' },
    { pl: 'Przysiad goblet', en: 'Goblet Squat', eq: 'kettlebell' },
    { pl: 'Wypychanie nóg na suwnicy', en: 'Leg Press', eq: 'maszyna' },
    { pl: 'Prostowanie nóg na maszynie', en: 'Leg Extension', eq: 'maszyna' },
    { pl: 'Wykroki z hantlami', en: 'Dumbbell Lunge', eq: 'hantle' },
    { pl: 'Przysiad bułgarski', en: 'Bulgarian Split Squat', eq: 'hantle' },
    { pl: 'Hack przysiad', en: 'Hack Squat', eq: 'maszyna' }
  ]},
  { group: 'Dwugłowe uda i pośladki', en: 'Hamstrings & Glutes', items: [
    { pl: 'Martwy ciąg rumuński', en: 'Romanian Deadlift', eq: 'sztanga' },
    { pl: 'Uginanie nóg na maszynie', en: 'Leg Curl', eq: 'maszyna' },
    { pl: 'Hip thrust', en: 'Hip Thrust', eq: 'sztanga' },
    { pl: 'Mostek biodrowy', en: 'Glute Bridge', eq: 'masa ciała' },
    { pl: 'Swing kettlebell', en: 'Kettlebell Swing', eq: 'kettlebell' },
    { pl: 'Odwodzenie nóg na maszynie', en: 'Hip Abduction', eq: 'maszyna' }
  ]},
  { group: 'Łydki', en: 'Calves', items: [
    { pl: 'Wspięcia na palce', en: 'Standing Calf Raise', eq: 'maszyna' },
    { pl: 'Wspięcia na palce siedząc', en: 'Seated Calf Raise', eq: 'maszyna' }
  ]},
  { group: 'Brzuch', en: 'Core', items: [
    { pl: 'Deska', en: 'Plank', eq: 'masa ciała' },
    { pl: 'Brzuszki', en: 'Crunch', eq: 'masa ciała' },
    { pl: 'Unoszenie nóg w zwisie', en: 'Hanging Leg Raise', eq: 'masa ciała' },
    { pl: 'Allahy (spięcia na wyciągu)', en: 'Cable Crunch', eq: 'wyciąg' },
    { pl: 'Kółko do brzucha', en: 'Ab Wheel Rollout', eq: 'masa ciała' },
    { pl: 'Rosyjskie skręty', en: 'Russian Twist', eq: 'masa ciała' }
  ]}
];
