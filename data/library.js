/* Planner food library and rule data.
   Item shape: F(id, name, group, source, flags)
     source: 'p' = 原文 (nutritionist PDF), 'r' = 建議 (derived, pending nutritionist review)
   Flags: c = recipe class, v = vegetarian protein, bf = allowed at breakfast, only = breakfast-only,
          deep = deep-sea fish, second = 次選 (red meat, rare in Random), lc = low-carb allowed,
          warn = advisory text, rice = rice-type starch, m = starch cook minutes, por = portion text.
   To remove an item the nutritionist rejects: delete its F(...) call. Nothing else needs to change. */
window.PLANNER_DATA=(function(){
function F(id,n,g,s,o){var x={id:id,n:n,g:g,s:s};if(o)for(var k in o)x[k]=o[k];return x}
var PROTEINS=[
F('salmon','三文魚','深海魚','p',{c:'fish',deep:1}),F('flounder','比目魚','深海魚','p',{c:'fish',deep:1}),F('mackerel','鯖魚','深海魚','p',{c:'fish',deep:1}),F('saury','秋刀魚','深海魚','p',{c:'fish',deep:1}),F('blackcod','銀鱈魚','深海魚','p',{c:'fish',deep:1}),F('tuna','吞拿魚','深海魚','p',{c:'fish',deep:1}),F('sardine','沙甸魚','深海魚','p',{c:'fish',deep:1}),
F('longli','龍脷柳','白肉魚','r',{c:'fish'}),F('seabass','鱸魚','白肉魚','r',{c:'fish'}),F('bream','鯛魚','白肉魚','r',{c:'fish'}),F('cod','鱈魚','白肉魚','r',{c:'fish'}),
F('chickb','雞胸','雞','p',{c:'chicken'}),F('chickl','去皮雞髀','雞','p',{c:'chicken'}),
F('shrimp','蝦','海鮮','p',{c:'shell'}),F('oyster','蠔','海鮮','p',{c:'shell'}),F('clam','蜆','海鮮','p',{c:'shell'}),F('scallop','帶子','海鮮','p',{c:'shell'}),F('squid','魷魚','海鮮','p',{c:'shell'}),F('crab','蟹','海鮮','p',{c:'shell'}),
F('fanshell','扇貝','海鮮','r',{c:'shell'}),F('mussel','青口','海鮮','r',{c:'shell'}),F('cuttle','花枝','海鮮','r',{c:'shell'}),F('ink','墨魚','海鮮','r',{c:'shell'}),
F('pork','豬（去肥膏）','豬','p',{c:'pork'}),F('tender','瘦豬柳','豬','r',{c:'pork'}),F('chop','豬扒','豬','r',{c:'pork'}),
F('beef','牛','次選（紅肉少食）','p',{c:'red',second:1}),F('lamb','羊','次選（紅肉少食）','p',{c:'red',second:1}),F('duck','鴨','次選（紅肉少食）','p',{c:'red',second:1}),F('goose','鵝','次選（紅肉少食）','p',{c:'red',second:1}),
F('egg','雞蛋','蛋','p',{c:'egg',v:1,bf:1}),F('eggw','蛋白','蛋','r',{c:'egg',v:1}),
F('tofu','豆腐','豆類及豆製品','p',{c:'tofu',v:1}),F('skin','腐皮','豆類及豆製品','p',{c:'tofu',v:1}),F('dtofu','豆乾','豆類及豆製品','p',{c:'tofu',v:1}),F('mushp','各類菇','豆類及豆製品','p',{c:'tofu',v:1}),F('chickpea','鷹嘴豆','豆類及豆製品','p',{c:'bean',v:1}),
F('edamame','毛豆','豆類（擴充）','r',{c:'bean',v:1}),F('lentil','扁豆','豆類（擴充）','r',{c:'bean',v:1}),F('kidney','紅腰豆','豆類（擴充）','r',{c:'bean',v:1}),F('tempeh','天貝','豆類（擴充）','r',{c:'tofu',v:1}),F('natto','納豆','豆類（擴充）','r',{c:'cold',v:1,note:'要確認無麩質'}),
F('ctuna','罐頭吞拿魚','罐頭魚（早餐）','p',{c:'can',deep:1,only:1,bf:1}),F('csalmon','罐頭三文魚','罐頭魚（早餐）','p',{c:'can',deep:1,only:1,bf:1}),F('csard','罐頭沙甸魚','罐頭魚（早餐）','p',{c:'can',deep:1,only:1,bf:1})];
var VEGS=[
F('spinach','菠菜','蔬菜','p',{e:'🥬'}),F('asp','蘆筍','蔬菜','p',{e:'🥬'}),F('tomato','番茄','蔬菜','p',{raw:1,e:'🍅'}),F('shiitake','冬菇','蔬菜','p',{e:'🍄'}),F('mushv','各類菇','蔬菜','p',{e:'🍄'}),F('cherry','車厘茄','蔬菜','p',{raw:1,e:'🍅'}),F('cuc','青瓜','蔬菜','p',{raw:2,e:'🥒'}),
F('broc','西蘭花','蔬菜','r',{e:'🥦'}),F('cauli','椰菜花','蔬菜','r',{e:'🥦'}),F('purplec','紫椰菜','蔬菜','r',{e:'🥬'}),F('napa','白菜','蔬菜','r',{e:'🥬'}),F('kailan','芥蘭','蔬菜','r',{e:'🥬'}),F('choy','菜心','蔬菜','r',{e:'🥬'}),
F('wmelon','冬瓜','蔬菜','r',{e:'🥒'}),F('hairy','節瓜','蔬菜','r',{e:'🥒'}),F('loofah','絲瓜','蔬菜','r',{e:'🥒'}),F('bitter','苦瓜','蔬菜','r',{e:'🥒'}),
F('celery','西芹','蔬菜','r',{e:'🥬'}),F('okra','秋葵','蔬菜','r',{e:'🥬'}),F('eggplant','茄子','蔬菜','r',{e:'🍆'}),F('pepper','彩椒','蔬菜','r',{e:'🫑'}),F('lettuce','西生菜','蔬菜','r',{raw:2,e:'🥬'}),F('kale','羽衣甘藍','蔬菜','r',{e:'🥬'}),F('peashoot','豆苗','蔬菜','r',{e:'🥬'}),F('tongcai','通菜','蔬菜','r',{e:'🥬'}),F('woodear','木耳','蔬菜','r',{e:'🍄'}),F('kelp','海帶','蔬菜','r',{e:'🥬'})];
var STARCH=[
F('sweet','蕃薯','澱粉','p',{por:'蕃薯 1 條',m:20,bf:1,e:'🍠'}),F('potato','薯仔','澱粉','p',{t:'拳頭薯仔',por:'薯仔 1 拳',m:15,e:'🥔'}),F('corn','粟米','澱粉','p',{por:'粟米 1 條',m:10,bf:1,e:'🌽'}),F('pumpkin','南瓜','澱粉','p',{por:'南瓜 1 碗',m:12,e:'🎃'}),F('yam','淮山','澱粉','p',{por:'淮山 1 條或 1 碗',m:10,e:'🥔'}),
F('rice','白飯','澱粉','p',{por:'白飯 4 湯匙',m:0,rice:1,e:'🍚'}),F('noodle','粉麵','澱粉','p',{por:'粉麵 1 碗',m:0,rice:1,warn:'含麩質',e:'🍜'}),
F('konjac','蒟蒻麵','澱粉（低碳可用）','p',{por:'蒟蒻麵 1 份',m:2,lc:1,e:'🍜'}),F('shirataki','芋絲','澱粉（低碳可用）','p',{por:'芋絲 1 份',m:2,lc:1,e:'🍜'}),
F('purple','紫薯','澱粉','r',{por:'紫薯 1 條',m:20,e:'🍠'}),F('taro','芋頭','澱粉','r',{por:'芋頭 1 拳',m:15,e:'🥔'}),F('chestnut','栗子（原粒無糖）','澱粉','r',{por:'栗子 1 小把',m:0,e:'🌰'}),
F('brown','糙米','澱粉','r',{por:'糙米 4 湯匙',m:0,rice:1,e:'🍚'}),F('redrice','紅米','澱粉','r',{por:'紅米 4 湯匙',m:0,rice:1,e:'🍚'}),F('quinoa','藜麥','澱粉','r',{por:'藜麥 4 湯匙',m:0,rice:1,e:'🍚'}),
F('vermi','米粉','澱粉','r',{por:'米粉 1 碗',m:0,rice:1,e:'🍜'}),F('flat','河粉','澱粉','r',{por:'河粉 1 碗',m:0,rice:1,e:'🍜'}),
F('none','不加','澱粉（低碳可用）','p',{por:'不加主食',m:0,lc:1,bf:1,e:''})];
var ADDONS=[
F('avo','牛油果','健康油脂及配料','p',{por:'牛油果半個',bf:1,e:'🥑'}),F('egg2','雞蛋（烚蛋）','健康油脂及配料','p',{por:'烚蛋 1 隻',bf:1,bfonly:1,e:'🥚'}),F('nuts','無鹽果仁','健康油脂及配料','p',{por:'無鹽果仁約 10 粒'}),F('seed','南瓜籽','健康油脂及配料','p',{por:'南瓜籽 1 湯匙'}),
F('olive','橄欖（少鹽）','健康油脂及配料','r',{por:'橄欖數粒'}),F('chia','奇亞籽','健康油脂及配料','r',{por:'奇亞籽 1 湯匙'}),F('flax','亞麻籽','健康油脂及配料','r',{por:'亞麻籽 1 湯匙'}),F('sesame','芝麻','健康油脂及配料','r',{por:'芝麻 1 茶匙'}),F('abutter','無糖杏仁醬','健康油脂及配料','r',{por:'無糖杏仁醬 1 湯匙或 1 茶匙'})];
var FRUITS=['蘋果 1 個','金奇異果 1 個','細青奇異果 2 個','橙 1 個','火龍果半個','草莓半碗','西瓜半碗','藍莓半盒','香蕉半條'];
var FRUITS_R=['木瓜','柚子','梨','番石榴'];
var SNACKS=['無鹽果仁約 10 粒','即食雞胸','去皮雞髀','雞蛋','車厘茄','青瓜','原味希臘乳酪','水果','無糖豆漿','杏仁奶','紫菜'];
var DEF_BOOST=['salmon','banana','chicken','potato','spinach','chickpea','seed','avo'];

var EAT_REST=[
{t:'外食改法・粉麵改菜底',e:'🍜🥬',por:['菜底代替麵，或換米粉 / 河粉 / 蒟蒻麵','肉類 1–2 個手掌','蔬菜 1 碗'],steps:['揀菜底，唔要粉麵；想食澱粉就換米粉、河粉或蒟蒻麵。','加 1–2 個手掌肉類，湯底唔好飲晒。','唔加炸物同甜飲品。']},
{t:'外食改法・淨燒味加菜',e:'🍗🥬',por:['燒味（去皮）1–2 個手掌','白灼菜 1 碗','白飯減至 4 湯匙'],steps:['揀燒雞、油雞或叉燒，去皮，行走可見肥膏。','菜唔淋蠔油，醬汁另上。','白飯只食 4 湯匙，其餘留低。']},
{t:'外食改法・扒餐加沙律菜',e:'🥩🥗',por:['牛扒或雞扒 1–2 個手掌','沙律菜 1 碗','唔食薯條同麵包'],steps:['扒餐換沙律菜，唔食薯條同麵包。','沙律醬汁另上，用檸檬汁同少量橄欖油。','飲水或無糖茶。']},
{t:'外食改法・淨魚蛋加菜',e:'🍢🥬',por:['魚蛋 1 碗','灼菜 1 碗','唔要粉麵'],steps:['叫淨魚蛋加灼菜，唔要粉麵。','辣醬同甜醬少用。','配 1 份水果或無糖飲品。']},
{t:'外食改法・食堂一餐',e:'🍠🍗🥬',por:['蕃薯 1 條或拳頭份薯仔 / 粟米','肉 1–2 個手掌','菜 1 碗'],steps:['揀 1 條蕃薯或拳頭份薯仔、粟米。','加 1–2 個手掌肉同 1 碗菜。','唔要炸物同重醬汁。']}];
var EAT_LOW=[
{t:'外食例子・淨魚蛋',e:'🍢🥬',por:['魚蛋 1 碗','蔬菜（份量加倍）','無澱粉'],steps:['叫淨魚蛋，唔要粉麵。','加灼菜，份量加倍。','辣醬同甜醬少用。']},
{t:'外食例子・淨燒味（單拼或雙拼）',e:'🍗🥬',por:['燒味 1–2 個手掌','灼菜（份量加倍）','無澱粉'],steps:['揀單拼或雙拼燒味，去皮，唔要飯。','加灼菜，唔淋蠔油。','醬汁另上。']},
{t:'外食例子・雞胸肉 / 牛扒 / 煙三文魚沙律',e:'🥗🍗',por:['雞胸肉、牛扒或煙三文魚 1–2 個手掌','沙律菜（份量加倍）','無澱粉'],steps:['揀雞胸肉、牛扒或煙三文魚沙律。','醬汁另上，用檸檬汁同少量橄欖油。','唔加麵包粒。']},
{t:'外食例子・粉麵改菜底',e:'🍜🥬',por:['肉類 1–2 個手掌','菜底（份量加倍）','無澱粉'],steps:['粉麵改為菜底。','湯唔好飲晒。','加 1–2 個手掌肉類。']},
{t:'外食例子・西餐扒餐加沙律菜',e:'🥩🥗',por:['扒類 1–2 個手掌','沙律菜（份量加倍）','唔要薯條、飯、麵包'],steps:['扒餐配沙律菜，唔要薯條、飯同麵包。','醬汁另上。','飲水或無糖茶。']}];
var AVOID=[['麵包','含麩質','番薯或粟米'],['包','含麩質','番薯或粟米'],['蛋糕','含麩質同高糖','水果或豆腐花'],['餅','含麩質','無鹽果仁'],['撻','含麩質','水果'],['pizza','含麩質','蒸或烤嘅主菜配蔬菜'],['披薩','含麩質','蒸或烤嘅主菜配蔬菜'],['饅頭','含麩質','番薯或粟米'],['西餅','含麩質','水果'],
['炸','係油炸食物','蒸或烤嘅同類食材'],['薯條','係油炸食物','拳頭份焗薯仔'],['腸','係加工食品','新鮮雞肉或魚'],['煙肉','係加工食品','新鮮雞肉或魚'],['火腿','係加工食品','新鮮雞肉或魚'],['午餐肉','係加工食品','新鮮雞肉或魚'],['鹹魚','係加工食品','新鮮魚'],
['醬','係重醬汁','薑、蔥、蒜同檸檬調味'],['蓮蓉','係高脂肪甜品','豆腐花或紅豆沙'],['豆沙','係高脂肪甜品','豆腐花或紅豆沙'],['奶黃','係高脂肪甜品','冰糖雪耳燉木瓜'],['酥','係高脂肪甜品','冰糖雪耳燉木瓜']];

return {proteins:PROTEINS,vegs:VEGS,starch:STARCH,addons:ADDONS,fruits:FRUITS,fruitsRest:FRUITS_R,snacks:SNACKS,defBoost:DEF_BOOST,eatRest:EAT_REST,eatLow:EAT_LOW,avoid:AVOID};
})();
