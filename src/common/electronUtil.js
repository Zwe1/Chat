/**
 * appData
 * Per-user application data directory, which by default points to:
 *
 * %APPDATA% on Windows
 * $XDG_CONFIG_HOME or ~/.config on Linux
 * ~/Library/Application Support on macOS
 *
 * userData
 * The directory for storing your app's configuration files, which by default it is the appData directory appended with your app's name.
 *
 * @returns {*|string}
 */
export function getUserDir() {
	const electron = window.require('electron');
	const { remote } = electron;
  return remote.app.getPath('userData');
}