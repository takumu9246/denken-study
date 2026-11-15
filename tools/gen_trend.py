# 過去問分析用スクリプト（作成時の作業環境のパスのまま。使うときは S のパスを書き換える）
import json, collections, sys
S='/tmp/claude-0/-home-user-senro-study/4cb97321-1f64-54f4-9931-d5699492e833/scratchpad'
sys.path.insert(0,S+'/tools')
from classify2 import NAMES, ROUND
d=json.load(open(f'{S}/cls_all.json'))
SUBJ={'q01':'riron','q02':'denryoku','q03':'kikai','q04':'hoki'}
ROUNDS=list(ROUND.values())
LES={'r_dc':['R01','R02'],'r_static':['R03'],'r_cap':['R04'],'r_mag':['R05'],'r_induct':['R06'],'r_ac':['R07'],'r_3phase':['R08'],'r_trans':['R09'],'r_semi':['R10'],'r_electron':['R10'],'r_opamp':['R11'],'r_meas':['R12'],
'p_hydro':['P01'],'p_thermal':['P02'],'p_nuclear':['P03'],'p_renew':['P03'],'p_sub':['P04','P08'],'p_trans':['P05','P08'],'p_under':['P06'],'p_dist':['P07','P08'],'p_mat':['P09'],
'm_dc':['M01'],'m_tr':['M02'],'m_ind':['M03'],'m_sync':['M04'],'m_pe':['M05'],'m_motorapp':['M06'],'m_light':['M07'],'m_heat':['M08'],'m_ctrl':['M09'],'m_info':['M10'],'m_chem':['M11'],
'h_jigyo':['H01'],'h_other':['H02'],'h_def':['H03'],'h_zetsu':['H03'],'h_earth':['H04'],'h_line':['H05'],'h_use':['H06'],'h_renew':['H07'],'h_kanri':['H08']}
SHORT={'r_static':'静','r_cap':'C','r_mag':'磁','r_induct':'誘','r_dc':'直','r_ac':'交','r_3phase':'三','r_trans':'過','r_electron':'電','r_semi':'半','r_opamp':'回','r_meas':'計',
'p_hydro':'水','p_thermal':'火','p_nuclear':'原','p_renew':'再','p_sub':'変','p_trans':'送','p_under':'地','p_dist':'配','p_mat':'材',
'm_dc':'直','m_ind':'誘','m_sync':'同','m_tr':'変','m_pe':'パ','m_motorapp':'応','m_light':'照','m_heat':'熱','m_ctrl':'制','m_info':'情','m_chem':'化',
'h_jigyo':'事','h_other':'工','h_def':'総','h_zetsu':'絶','h_earth':'接','h_line':'線','h_use':'使','h_renew':'連','h_kanri':'管'}
out={'rounds':ROUNDS,'themes':{},'matrix':{}}
for q,sid in SUBJ.items():
    mat={}
    rc=collections.Counter(); qc=collections.Counter(); pos=collections.defaultdict(collections.Counter)
    for r in ROUNDS:
        qs=d[q].get(r,{})
        n=max(map(int,qs)) if qs else 0
        mat[r]=[qs.get(str(i),'') for i in range(1,n+1)]
        for t in set(qs.values()): rc[t]+=1
        for i,t in qs.items(): qc[t]+=1; pos[t][int(i)]+=1
    out['matrix'][sid]=mat
    for t in sorted(qc, key=lambda x:-qc[x]):
        if t=='??': continue
        p=[i for i,c in sorted(pos[t].items()) if c>=4]
        out['themes'][t]={'subj':sid,'name':NAMES[t],'short':SHORT[t],'freq':rc[t],'n':qc[t],'pos':p,'lessons':LES[t]}
js='// 過去問分析（自動生成：docs/ANALYSIS.md 参照）\n// 平成28年度〜令和8年度上期の15回分。問題用紙（電気技術者試験センター公表）の各問の冒頭文からキーワードでテーマを判定し、目視で補正\n'
js+='const TREND = '+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n'
open('/home/user/denken-study/js/trend.js','w').write(js)
for sid in SUBJ.values():
    print(sid,[ (t,v['freq'],v['n'],v['pos']) for t,v in out['themes'].items() if v['subj']==sid])
