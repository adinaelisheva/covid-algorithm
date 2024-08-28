window.onload = () => {
  // Gather data
  const covidNumbers = mwradata[1];
  const lastCovid = Date.parse(PERSONAL_DATA[0]);
  let lastBooster = Date.parse(PERSONAL_DATA[1]);
  const now = new Date().getTime();

  const msPerDay = 1000 * 60 * 60 * 24;
  let daysSinceBooster = (now - lastBooster) / msPerDay;
  const daysSinceCovid = (now - lastCovid) / msPerDay;

  let nextTest = 'None! Buy more!';
  let nextTestDate = Infinity;
  TEST_EXPIRATION_DATES.forEach((dateStr) => {
    const date = Date.parse(dateStr);
    if (date < nextTestDate && date > now) {
      nextTestDate = date;
      nextTest = dateStr;
    }
  });
  
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
  if (daysSinceBooster < 10) {
    // Still cooking. For the math, assume it's out of the picture
    daysSinceBooster = Infinity;
  }


  const thirtyDays = 1000 * 60 * 60 * 24 * 30;
  document.querySelector('.nextTestExpires').innerHTML = nextTest;
  if (nextTestDate === Infinity) {
    document.querySelector('.nextTestExpires').classList.add('red');
  } else if (nextTestDate - now < thirtyDays) {
    document.querySelector('.nextTestExpires').classList.add('yellow');
  }

  let worryLevel = 0;
  if (covidNumbers < COVID_NUMBER_WORRY_LEVELS[0]) {
    worryLevel = 0; // No worry at all
  } else if (covidNumbers < COVID_NUMBER_WORRY_LEVELS[1]) {
    worryLevel = 1; // Low worry - No need to mask in most places
  } else if (covidNumbers < COVID_NUMBER_WORRY_LEVELS[2]) {
    worryLevel = 2; // Regular worry - mask in crowds but don't worry too much
  } else if (covidNumbers < COVID_NUMBER_WORRY_LEVELS[3]) {
    worryLevel = 3; // Slightly extra worry - try to be more careful
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
  // Only mark the "distant" items as red if it's worth worrying about
  const sixMonthDays = thirtyDays * 6;
  if (daysSinceCovid  > COVID_DISTANT_CUTOFF && daysSinceBooster >= sixMonthDays) {
    document.querySelector('.sinceCovid').classList.add('red');
  }
  if (daysSinceBooster > COVID_DISTANT_CUTOFF && daysSinceBooster !== Infinity && daysSinceCovid >= sixMonthDays) {
    document.querySelector('.sinceBooster').classList.add('red');
  }

  const eventMask = document.querySelector('.eventMask');
  const tMask = document.querySelector('.tMask');
  const storeMask = document.querySelector('.storeMask');
  const dining = document.querySelector('.dining');
  const wfh = document.querySelector('.wfh');

  // Mask at events basically always
  if (worryLevel === 0) {
    eventMask.innerHTML = 'N';
    eventMask.classList.add('green');
  } else {
    eventMask.innerHTML = 'Y';
    eventMask.classList.add('red');
  }

  // Mask on the T basically always, but less concerned if it's empty
  if (worryLevel === 0) {
    tMask.innerHTML = 'N';
    tMask.classList.add('green');
  } else if (worryLevel === 1) {
    tMask.innerHTML = 'If busy';
    tMask.classList.add('yellow');
  } else {
    tMask.innerHTML = 'Y';
    tMask.classList.add('red');
  }

  if (worryLevel <= 2) {
    storeMask.innerHTML = 'N';
    storeMask.classList.add('green');
  } else {
    storeMask.innerHTML = 'Y';
    storeMask.classList.add('red');
  }

  if (worryLevel <= 2) {
    dining.innerHTML = 'Y';
    dining.classList.add('green');
  } else if (worryLevel === 3) {
    dining.innerHTML = 'rarely';
    dining.classList.add('yellow');
  } else {
    dining.innerHTML = 'N';
    dining.classList.add('red');
  }

  if (worryLevel <= 3) {
    wfh.innerHTML = 'N';
    wfh.classList.add('green');
  } else {
    wfh.innerHTML = 'Y';
    wfh.classList.add('red');
  }

}

function getFlexibleTimeString(days) {
  days = Math.floor(days);
  if (days === Infinity) {
    return 'Undeterminable';
  }
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