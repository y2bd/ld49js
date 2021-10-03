const SEVERITY = {
  VERBOSE: 'verbose',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  FATAL: 'fatal',
  DIALOGUE: 'dialogue'
};

let logCount = 0;
const logWrap = 4;

function addLog(message = "hello world", severity = SEVERITY['VERBOSE']) {
  const log = document.getElementById('log');

  const p = document.createElement('p');

  p.innerText = `${choosePrefix()}${message} `;
  p.classList.add(severity);

  log.appendChild(p);
  p.scrollIntoView();

  logCount++;

  if (logCount >= logWrap) {
    logCount = 0;
    const breakP = document.createElement('p');
    breakP.innerText = '';
    breakP.classList.add('break');

    log.appendChild(breakP);
  }
}

function choosePrefix() {
  if (logCount <= 0) {
    return '';
  }

  const prefixes = ['Next, ', 'Next ', 'Then, ', 'Afterwards, ', '', 'After, ', 'Near after ', '', '', 'Following, ', ''];
  return prefixes[randInt(0, prefixes.length)];
}