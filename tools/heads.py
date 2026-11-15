# 過去問分析用スクリプト（作成時の作業環境のパスのまま。使うときは S のパスを書き換える）
import re, sys, glob, os, json
S='/tmp/claude-0/-home-user-senro-study/4cb97321-1f64-54f4-9931-d5699492e833/scratchpad'
z2h=str.maketrans('０１２３４５６７８９','0123456789')
def load(path):
    t=open(path,encoding='utf-8',errors='ignore').read()
    t=t.translate(z2h)
    lines=[l for l in t.split('\n') if not re.search(r'indd|■ T\d|^\s*-\s*\d+\s*-\s*$',l)]
    return '\n'.join(lines)
def split(t):
    m=re.search(r"(?:[ＡA]\s*[問間]\s*題|[問間]\s*1\s*[^日\n]{0,6}(?:次|図|真空|電))",t)
    if m: t=t[m.start():]
    # find 問N at line start
    parts=re.split(r'\n\s*[問間閑周]\s*(\d{1,2})\s*',t)
    out={}
    for i in range(1,len(parts)-1,2):
        n=int(parts[i]); body=re.sub(r'\s+','',parts[i+1])
        if n not in out and 1<=n<=18 and not body.startswith(('及び','又は')): out[n]=body
    return out
res={}
src=sys.argv[1]  # txt or ocr
for f in sorted(glob.glob(f'{S}/{src}/*_q0[1-4].txt')):
    k=os.path.basename(f)[:-4]
    res[k]=split(load(f))
json.dump(res,open(f'{S}/heads_{src}.json','w'),ensure_ascii=False)
for k,v in res.items():
    print('==',k,sorted(v))
