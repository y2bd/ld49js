const SEVERITY = {
  VERBOSE: 0,
  INFO: 1,
  WARNING: 2,
  ERROR: 3,
  FATAL: 4,
  DIALOGUE: 5,
  SUCCESS: 6,
};

const SEVERITY_REV = {
  0: 'verbose',
  1: 'info',
  2: 'warning',
  3: 'error',
  4: 'fatal',
  5: 'dialogue',
  6: 'success'
};

let logCount = 0;
const logWrap = 4;

let dialogOccuring = false;

function playDialog(messages = []) {
  let cancelled = false;

  const dialog = async () => {
    messages = [].concat(messages);

    dialogOccuring = true;

    while (messages.length > 0) {
      if (cancelled) {
        dialogOccuring = false;
        return false;
      }

      const nextMessage = messages.shift();
      addLog(nextMessage, SEVERITY['DIALOGUE']);
      await delay(1500);
    }

    dialogOccuring = false;
    return true;
  }

  return {
    dialogPromise: dialog(),
    cancellationToken: () => cancelled = true
  }
}

function addLog(message = "hello world", severity = SEVERITY['VERBOSE']) {
  if (dialogOccuring && severity < SEVERITY.FATAL) {
    return;
  }

  const log = document.getElementById('log');

  if (message.startsWith('@BREAK')) {
    logCount = 0;
    message = message.substring('@BREAK'.length);
    insertBreak(log);
  }

  const p = document.createElement('p');

  p.innerText = `${choosePrefix(severity)}${message} `;
  p.classList.add(SEVERITY_REV[severity]);

  log.appendChild(p);
  p.scrollIntoView();

  logCount++;

  if (logCount >= logWrap) {
    logCount = 0;
    insertBreak(log);
  }
}

function insertBreak(log) {
  const breakP = document.createElement('p');
  breakP.innerText = '';
  breakP.classList.add('break');

  log.appendChild(breakP);
}

function choosePrefix(severity) {
  if (severity >= SEVERITY.FATAL) {
    return '';
  }

  if (logCount <= 0) {
    return '';
  }

  const prefixes = ['Next, ', 'Next ', 'Then, ', 'Afterwards, ', '', 'After, ', 'Near after ', '', '', 'Following, ', ''];
  return prefixes[randInt(0, prefixes.length)];
}