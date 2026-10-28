/* 保存処理をUIから分離。将来はRepositoryをクラウド実装へ差し替える。 */
(function(root){'use strict';
function validDate(key){if(!/^\d{4}-\d{2}-\d{2}$/.test(key))return false;const d=new Date(key+'T00:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===key}
function validateDays(days){
 if(!days||typeof days!=='object'||Array.isArray(days))throw Error('日付データが不正です');
 const clean={};
 for(const [date,day] of Object.entries(days)){
  if(!validDate(date)||!day||!Array.isArray(day.exercises)||day.exercises.length>1000||typeof day.note!=='string')throw Error('日付・メモの形式が不正です');
  clean[date]={note:day.note,exercises:day.exercises.map(x=>{
   if(!x||typeof x.name!=='string'||!x.name.trim()||x.name.length>80||!Array.isArray(x.sets)||!x.sets.length||x.sets.length>100)throw Error('種目データが不正です');
   return {name:x.name,sets:x.sets.map(s=>{if(!s||typeof s.weight!=='number'||!Number.isFinite(s.weight)||s.weight<0||s.weight>2000||!Number.isInteger(s.reps)||s.reps<1||s.reps>999)throw Error('セットデータが不正です');return {weight:s.weight,reps:s.reps}})};
  })};
 }return clean;
}
function validDraft(d){return !!d&&validDate(d.date)&&Number.isInteger(d.index)&&d.index>=-1&&d.value&&typeof d.value.name==='string'&&d.value.name.length<=80&&Array.isArray(d.value.sets)&&d.value.sets.length>0&&d.value.sets.length<=100&&d.value.sets.every(s=>s&&typeof s.weight==='string'&&typeof s.reps==='string')}
function validateBackup(p){if(!p||p.app!=='workout-diary'||p.version!==1)throw Error('対応するバックアップ形式ではありません');return validateDays(p.days)}
class Repository{
 constructor(storage,key='workout-diary-v1'){this.storage=storage;this.key=key}
 load(){const raw=this.storage.getItem(this.key);return raw===null?{}:validateDays(JSON.parse(raw))}
 save(days){const clean=validateDays(days);this.storage.setItem(this.key,JSON.stringify(clean))}
}
function previous(days,date,name){const n=name.trim().normalize('NFKC').toLocaleLowerCase('ja');if(!n)return null;for(const key of Object.keys(days).filter(k=>k<date).sort().reverse()){const exercise=days[key].exercises.find(x=>x.name.trim().normalize('NFKC').toLocaleLowerCase('ja')===n);if(exercise)return {date:key,exercise}}return null}
const api={Repository,validDraft,validDate,validateDays,validateBackup,previous};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.WorkoutStorage=api;
})(globalThis);
