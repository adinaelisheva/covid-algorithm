window.onload = () => {
  // Gather data
  const covidNumbers = coviddata[1];
  const lastCovid = Date.parse(PERSONAL_DATA[0]);
  let lastBooster = Date.parse(PERSONAL_DATA[1]);
  const now = new Date().getTime();

  // Since mass.gov has both "Minimal" and "Low", shift everything
  const fluLevel = Math.max(fludata[1] - 1, 0);
  const fluLevels = ["Low", "Moderate", "High", "Very High"];
  const fluLevelStr = fluLevels[fluLevel];

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
  document.querySelector('.coviddatadate').innerHTML = coviddata[0];
  document.querySelector('.covidNums').innerHTML = covidNumbers;
  if (covidNumbers < COLOR_THRESHHOLDS[0]) {
    document.querySelector('.covidNums').classList.add('greenBg');
  } else if(covidNumbers < COLOR_THRESHHOLDS[1]) {
    document.querySelector('.covidNums').classList.add('yellowBg');
  } else {
    document.querySelector('.covidNums').classList.add('redBg');
  }

  document.querySelector('.fludatadate').innerHTML = fludata[0];
  document.querySelector('.fluLevel').innerHTML = fluLevelStr;
  if (fluLevel < 1) {
    document.querySelector('.fluLevel').classList.add('greenBg');
  } else if(fluLevel < 2) {
    document.querySelector('.fluLevel').classList.add('yellowBg');
  } else {
    document.querySelector('.fluLevel').classList.add('redBg');
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
  if (fluLevel > worryLevel) {
    worryLevel = fluLevel;
  }


  // Only mark the "distant" items as red if it's worth worrying about
  const sixMonthDays = thirtyDays * 6;
  if (daysSinceCovid  > COVID_DISTANT_CUTOFF && daysSinceBooster >= sixMonthDays) {
    document.querySelector('.sinceCovid').classList.add('red');
  }
  if (daysSinceBooster > COVID_DISTANT_CUTOFF && daysSinceBooster !== Infinity && daysSinceCovid >= sixMonthDays) {
    document.querySelector('.sinceBooster').classList.add('red');
  }

  const table = document.querySelector('.eventTable');
  for (item of ACTIVITY_LEVELS) {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.innerText = item.name;
    row.appendChild(nameCell);
    const worryCell = document.createElement('td');
    if (worryLevel <= item.noWorryLevel) {
      worryCell.innerText = item.noWorryString || 'N';
      worryCell.classList.add('green');
    } else if (item.someWorryLevel && worryLevel <= item.someWorryLevel) {
      worryCell.innerText = item.someWorryString || 'M';
      worryCell.classList.add('yellow');
    } else {
      worryCell.innerText = item.allWorryString || 'Y';
      worryCell.classList.add('red');
    }
    row.appendChild(worryCell);
    table.appendChild(row);
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