/* Default content for the Soon Family Christmas Lucky Draw 2025.
   The host can change both lists on the setup screen; edits are saved in this browser. */
window.XMAS = window.XMAS || {};

XMAS.DEFAULT_NAMES = [
  'Da Sao', 'Lynette', 'Thian Pong', 'Yvette', 'Gabriel', 'Samuel', 'Susan', 'Emmanual',
  'Michelle', 'Sebastian', 'Sarah', 'Da Ee Ee', 'Uncle John', 'Sharon', 'Leslie', 'Kenzie',
  'Jezzrie', 'Calvin', 'Joyce', 'Shaniah', 'Nataniah', 'Adeliah', 'Emeliah', 'Amor',
  'Mama Lily', 'Mah Chye', 'Sharon', 'Austin', 'Ashley', 'Mah Kok', 'Gma', 'Gpa',
  'Steffi', 'Clement', 'Noah', 'Mark', 'Ben', 'Vivien', 'Paul', 'Lisa',
  'Priscilla', 'Keegan', 'Kaka Lisa', 'Chris', 'Darren', 'Denise', 'Vanessa', 'Bryle',
  'Roger', 'May Soon', 'Martin', 'Marcus', 'Marissa', 'Kaka Emma', 'Rinnah', 'Shanna',
  'Yuan Zhang', 'Maggi Teo', "Sally (Clem's mum)", 'Jing Jie', "JJ's mum", 'May Chua',
  'Johannes', 'Mikael', 'Margorie'
];

/* Prizes in rank order: the first item is the 1st prize. The draw counts up from the last
   prize, so the 1st prize is always the finale. */
XMAS.DEFAULT_PRIZES = [
  'iPhone 17 Pro',
  'iPad Wi-Fi 256GB',
  '$600',
  '$500',
  '$400',
  'Apple Watch',
  'AirPods Pro',
  'Gold Class ticket + $80 voucher',
  'Air fryer',
  'BBQ grill'
];

/* 150 made-up names for a rehearsal run (never saved, never mixed into the real list). */
XMAS.testNames = function (n = 150) {
  const first = ['Mei Ling', 'Wei Jie', 'Aunty Rose', 'Uncle Tan', 'Hui Min', 'Jun Hao', 'Grace', 'Daniel', 'Siew Lan', 'Kok Wah',
    'Priya', 'Arjun', 'Nurul', 'Hafiz', 'Chloe', 'Ethan', 'Isabelle', 'Lucas', 'Pei Shan', 'Zhi Hao', 'Ah Ma', 'Ah Gong',
    'Rachel', 'Bryan', 'Joanne', 'Kelvin', 'Valerie', 'Jasper', 'Felicia', 'Desmond'];
  const last = ['T.', 'L.', 'W.', 'C.', 'N.', 'K.', 'S.', 'H.', 'Y.', 'G.'];
  const out = [];
  for (let i = 0; out.length < n; i++) out.push(`${first[i % first.length]} ${last[Math.floor(i / first.length) % last.length]}`);
  return out;
};
