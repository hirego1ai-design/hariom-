const fs = require('fs');
let code = fs.readFileSync('src/app/employer/full-candidate-profile-employer-view/page.tsx', 'utf8');

// Regex to find multiple className="..." on any HTML/JSX element
// It finds elements that have two className props separated by some other props or spaces
code = code.replace(/className="([^"]+)"\s*(.*?)className="([^"]+)"/g, (match, class1, middle, class2) => {
    // If there is no 'className="' inside middle, we merge them
    if (middle.indexOf('className=') === -1) {
        return \className="\ \" \\;
    }
    return match; // Otherwise let it be, might be nested tags
});

// Since the above might not catch it if the tags are like: <div className="..." className="..."> 
// Wait, the regex matched \className="A" anything className="B"\. 
// The problem is if the anything contains a > (so it's across elements). We must restrict to within the same tag.
