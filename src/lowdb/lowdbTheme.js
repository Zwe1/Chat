import { getCurrentDB } from "./lowdbUtil";
import _ from "lodash";
import moment from "moment";

function db() {
  return getCurrentDB('theme');
}

/* theme */
export function setTheme(theme = {}) {
  db()
    .set('theme', theme)
    .write();
}

export function getTheme() {
  return db()
    .get('theme')
    .value();
}