import re


session_id = 'c1d02afb-3406-43ce-9812-154716915fc1'
one_attachment = 'e90fdd5c-8fe9-4180-8f75-45d84841081b.png'
one_title = 'image.png'
one_id = '1f3b26393ae44571a3a50f7a1a78acd2'

pattern = "\\[[^]]*]\\(/joplin/edit_session_ressource/{}/{}\\)".format(
    re.escape(session_id), re.escape(one_attachment))
repl = "[{}](:/{})".format(one_title, one_id)
md = '![](/joplin/edit_session_ressource/c1d02afb-3406-43ce-9812-154716915fc1/e90fdd5c-8fe9-4180-8f75-45d84841081b.png)'

print(pattern)

md2 = re.sub(pattern, repl, md)

print(md)
print()
print()
print()
print(md2)
