import { getCurrentDB } from "./lowdbUtil";

function db() {
  return getCurrentDB('shortCut');
}

export function setShortCut(obj) {
  db()
    .set('shortCut', obj)
    .write();
}

export function getShortCut() {
  return db()
    .get('shortCut')
    .value();
}

export function setSwitch(key, state) {
	db()
		.set(key, state)
		.write();
}

export function getSwitch(key) {
	return db()
		.get(key)
		.value();
}

export function setPanelSelect(state) {
  db()
    .set('PanelSelect', state)
    .write();
}

export function getPanelSelect() {
  return db()
    .get('PanelSelect')
    .value();
}

export function setSendMsgSelect(state) {
  db()
    .set('sendMsgSelect', state)
    .write();
}

export function getSendMsgSelect() {
  return db()
    .get('sendMsgSelect')
    .value();
}