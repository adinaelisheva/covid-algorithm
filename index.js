// --- Worry level adjustments can be made here: --------------------
covidNumberWorryLevels = [
  50, // Level 0. Below this and covid is 'over' - do anything
  500, // Level 1. Below this and I can stop masking in stores etc
  1000, // Level 2. Below this and I don't have to worry about restaurants
  2500 // Level 3. Be more careful about events, restaurants, etc
  // Above this = SURGE! Start staying home.
];

// Days in which covid or booster was so recent I don't worry about anything
covidRecentCutoff = 30;
// Days in which covid or booster was so long ago I want to be extra cautious
covidDistantCutoff = 250;

// ------------------------------------------------------------------

window.onload = () => {
  // Gather data
  const covidNumbers = mwradata[1];
  const lastCovid = Date.parse(personaldata[0]);
  const lastBooster = Date.parse(personaldata[1]);
  const now = new Date().getTime();

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysSinceBooster = (now - lastBooster) / msPerDay;
  const daysSinceCovid = (now - lastCovid) / msPerDay;
  
  // Update fields
  document.querySelector('.date').innerHTML = mwradata[0];
  document.querySelector('.covidNums').innerHTML = covidNumbers;
  if (covidNumbers < 1000) {
    document.querySelector('.covidNums').classList.add('greenBg');
  } else if(covidNumbers < 2000) {
    document.querySelector('.covidNums').classList.add('yellowBg');
  } else {
    document.querySelector('.covidNums').classList.add('redBg');
  }
  document.querySelector('.sinceCovid').innerHTML = getFlexibleTimeString(daysSinceCovid);
  document.querySelector('.sinceBooster').innerHTML = getFlexibleTimeString(daysSinceBooster);

  let worryLevel = 0;
  if (covidNumbers < covidNumberWorryLevels[0]) {
    worryLevel = 0; // No worry at all
  } else if (covidNumbers < covidNumberWorryLevels[1]) {
    worryLevel = 1; // Low worry - No need to mask in stores etc
  } else if (covidNumbers < covidNumberWorryLevels[2]) {
    worryLevel = 2; // Regular worry - mask in stores but don't worry about eating out
  } else if (covidNumbers < covidNumberWorryLevels[3]) {
    worryLevel = 3; // Slightly extra worry - try to eat out less
  } else {
    worryLevel = 4; // Surge! Try to stay home
  }
  if (daysSinceCovid  < covidRecentCutoff) {
    worryLevel = 0;
    document.querySelector('.sinceCovid').classList.add('green');
  }
  if (daysSinceBooster < covidRecentCutoff) {
    worryLevel = 0;
    document.querySelector('.sinceBooster').classList.add('green');
  }
  if (daysSinceCovid > covidDistantCutoff && daysSinceBooster > covidDistantCutoff && worryLevel < 4) {
    worryLevel++;
  }
  if (daysSinceCovid  > covidDistantCutoff) {
    document.querySelector('.sinceCovid').classList.add('red');
  }
  if (daysSinceBooster > covidDistantCutoff) {
    document.querySelector('.sinceBooster').classList.add('red');
  }

  const eventMask = document.querySelector('.eventMask');
  const tMask = document.querySelector('.tMask');
  const storeMask = document.querySelector('.storeMask');
  const dining = document.querySelector('.dining');
  const wfh = document.querySelector('.wfh');

  // Mask on the T and at events basically always
  if (worryLevel < 1) {
    eventMask.innerHTML = 'N';
    eventMask.classList.add('green');
    tMask.innerHTML = 'N';
    tMask.classList.add('green');
  } else {
    eventMask.innerHTML = 'Y';
    eventMask.classList.add('red');
    tMask.innerHTML = 'Y';
    tMask.classList.add('red');
  }

  if (worryLevel < 2) {
    storeMask.innerHTML = 'N';
    storeMask.classList.add('green');
  } else {
    storeMask.innerHTML = 'Y';
    storeMask.classList.add('red');
  }

  if (worryLevel < 3) {
    dining.innerHTML = 'Y';
    dining.classList.add('green');
  } else if (worryLevel < 4) {
    dining.innerHTML = 'rarely';
    dining.classList.add('yellow');
  } else {
    dining.innerHTML = 'N';
    dining.classList.add('red');
  }

  if (worryLevel < 4) {
    wfh.innerHTML = 'N';
    wfh.classList.add('green');
  } else {
    wfh.innerHTML = 'Y';
    wfh.classList.add('red');
  }

}

function getFlexibleTimeString(days) {
  if (days < 14) {
    return days + ' days';
  }
  weeks = Math.floor(days / 7);
  if (weeks < 9) {
    return weeks + ' weeks';
  }
  months = Math.floor(days / 30);
  return months + ' months';
}