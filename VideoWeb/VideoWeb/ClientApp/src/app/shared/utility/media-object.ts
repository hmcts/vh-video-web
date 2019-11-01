import { Injectable } from '@angular/core';

@Injectable()
export class MediaObject {

    constructor() { }

  public static assignStream(video, url) {
      if (typeof (MediaStream) !== 'undefined' && url instanceof MediaStream) {
          video.srcObject = url;
      } else {
          video.src = url;
      }
  }
}
