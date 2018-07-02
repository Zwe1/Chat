import { getCurrentDB } from "./lowdbUtil";

function db() {
  return getCurrentDB('company');
}

/* companys */
export function setCompanys(companys = []) {
  db().set('companys', companys).write();
}

export function getCompanys() {
  return db().get('companys').value();
}


/* contacts */
export function setContacts(contacts = []) {
  db().set('contacts', contacts).write();
}

export function getContacts() {
  return db().get('contacts').value();
}

export function saveContacts(id, depts) {
  db()
    .get('contacts')
    .find({ id: id })
    .assign({ depts: depts })
    .write();
}

/* My depts */
export function setMyDepts(companyData = []) {
  db().set('myDepts', companyData).write();
}

export function getMyDepts() {
  return db().get('myDepts').value();
}