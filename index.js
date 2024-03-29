window.onload = () => {
  // Gather data
  const covidNumbers = mwradata[1];
  const lastCovid = Date.parse(PERSONAL_DATA[0]);
  const lastBooster = Date.parse(PERSONAL_DATA[1]);
  const now = new Date().getTime();

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysSinceBooster = (now - lastBooster) / msPerDay;
  const daysSinceCovid = (now - lastCovid) / msPerDay;

  nextTest = Infinity;
  TEST_EXPIRATION_DATES.forEach((dateStr) => {
    const date = Date.parse(dateStr);
    if (date < nextTest && date > now) {
      nextTest = dateStr;
    }
  });
  if (nextTest === Infinity) {
    nextTest = 'None! Buy more!';
  }
  
  // Update fields
  document.querySelector('.date').innerHTML = mwradata[0];
  document.querySelector('.covidNums').innerHTML = covidNumbers;
  if (covidNumbers < COLOR_THRESHHOLDS[0]) {
    document.querySelector('.covidNums').classList.add('greenBg');
  } else if(covidNumbers < COLOR_THRESHHOLDS[1]) {
    document.querySelector('.covidNums').classList.add('yellowBg');
  } else {
    document.querySelector('.covidNums').classList.add('redBg');
  }
  document.querySelector('.sinceCovid').innerHTML = getFlexibleTimeString(daysSinceCovid);
  document.querySelector('.sinceBooster').innerHTML = getFlexibleTimeString(daysSinceBooster);

  const thirtyDays = 1000 * 60 * 60 * 24 * 30;
  document.querySelector('.nextTestExpires').innerHTML = nextTest;
  if (nextTest.startsWith('None')) {
    document.querySelector('.nextTestExpires').classList.add('red');
  } else if (Date.parse(nextTest) - now < thirtyDays) {
    document.querySelector('.nextTestExpires').classList.add('yellow');
  }

  let worryLevel = 0;
  if (covidNumbers < COVID_NUMBER_WORRY_LEVELS[0]) {
    worryLevel = 0; // No worry at all
  } else if (covidNumbers < COVID_NUMBER_WORRY_LEVELS[1]) {
    worryLevel = 1; // Low worry - No need to mask in stores etc
  } else if (covidNumbers < COVID_NUMBER_WORRY_LEVELS[2]) {
    worryLevel = 2; // Regular worry - mask in stores but don't worry about eating out
  } else if (covidNumbers < COVID_NUMBER_WORRY_LEVELS[3]) {
    worryLevel = 3; // Slightly extra worry - try to eat out less
  } else {
    worryLevel = 4; // Surge! Try to stay home
  }
  if (daysSinceCovid  < COVID_RECENT_CUTOFF) {
    worryLevel = 0;
    document.querySelector('.sinceCovid').classList.add('green');
  }
  if (daysSinceBooster < COVID_RECENT_CUTOFF) {
    worryLevel = 0;
    document.querySelector('.sinceBooster').classList.add('green');
  }
  if (daysSinceCovid > COVID_DISTANT_CUTOFF && daysSinceBooster > COVID_DISTANT_CUTOFF && worryLevel < 4) {
    worryLevel++;
  }
  if (daysSinceCovid  > COVID_DISTANT_CUTOFF) {
    document.querySelector('.sinceCovid').classList.add('red');
  }
  if (daysSinceBooster > COVID_DISTANT_CUTOFF) {
    document.querySelector('.sinceBooster').classList.add('red');
  }

  const eventMask = document.querySelector('.eventMask');
  const tMask = document.querySelector('.tMask');
  const storeMask = document.querySelector('.storeMask');
  const dining = document.querySelector('.dining');
  const wfh = document.querySelector('.wfh');

  // Mask at events basically always
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

  // Mask on the T basically always, but less concerned if it's empty
  if (worryLevel < 1) {
    tMask.innerHTML = 'N';
    tMask.classList.add('green');
  } else if (worryLevel < 2) {
    tMask.innerHTML = 'If busy';
    tMask.classList.add('yellow');
  } else {
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