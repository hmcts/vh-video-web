import { Injectable } from '@angular/core';

@Injectable()
export class MediaObject {

  constructor() { }

  public static assignStream(videoElement, stream) {
    if (typeof (MediaStream) !== 'undefined' && stream instanceof MediaStream) {
      videoElement.srcObject = stream;
    } else {
      videoElement.src = stream;
    }
  }

  public static clearStream(videoElement, stream) {
    if (typeof (MediaStream) !== 'undefined' && stream instanceof MediaStream) {
      videoElement.srcObject = null;
    } else {
      videoElement.src = null;
    }
  }
}
