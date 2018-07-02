export const allowImageTypes = ['jpg', 'jpeg', 'png'];
export const allowAudioTypes = ['amr'];
export const allowVideoTypes = ['mp4'];

export default function getFileType(ext) {
  if (allowAudioTypes.indexOf(ext) > -1) {
    return 'voice';
  } else if (allowImageTypes.indexOf(ext) > -1) {
    return 'image';
  } else if (allowVideoTypes.indexOf(ext) > -1) {
    return 'video';
  } else {
    return 'file';
  }
}
