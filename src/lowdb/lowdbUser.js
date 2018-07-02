import { getCurrentDB } from "./lowdbUtil";

function db() {
  return getCurrentDB('user');
}