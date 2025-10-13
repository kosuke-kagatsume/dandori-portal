// ブラウザのConsoleタブで実行してください
const button = document.querySelector('.rdp-day_selected .rdp-button') || document.querySelector('.rdp-button');
console.log('=== BUTTON DEBUG ===');
console.log('Tag:', button?.tagName);
console.log('Classes:', button?.className);
console.log('Width:', window.getComputedStyle(button).width);
console.log('Height:', window.getComputedStyle(button).height);
console.log('Padding:', window.getComputedStyle(button).padding);
console.log('Display:', window.getComputedStyle(button).display);
console.log('Box-sizing:', window.getComputedStyle(button).boxSizing);
console.log('Inline styles:', button?.style.cssText);
console.log('HTML:', button?.outerHTML);

// どのCSSルールが width を設定しているか
const styles = window.getComputedStyle(button);
console.log('\n=== CSS RULES ===');
for (let sheet of document.styleSheets) {
  try {
    for (let rule of sheet.cssRules) {
      if (rule.selectorText && rule.selectorText.includes('rdp-button')) {
        console.log('Selector:', rule.selectorText);
        console.log('CSS:', rule.cssText);
      }
    }
  } catch (e) {}
}
