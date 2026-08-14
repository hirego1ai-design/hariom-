import re
path = 'src/app/employer/full-candidate-profile-employer-view/page.tsx'
with open(path, 'r', encoding='utf8') as f:
    content = f.read()
pattern = r'className="([^"]+)"([^><]+)className="([^"]+)"'
def replacer(match):
    c1 = match.group(1)
    middle = match.group(2)
    c2 = match.group(3)
    return f'className="{c1} {c2}"{middle}'
new_content = re.sub(pattern, replacer, content)
with open(path, 'w', encoding='utf8') as f:
    f.write(new_content)
