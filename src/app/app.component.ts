import { Component, ComponentRef, ElementRef, ViewChild, ViewContainerRef } from '@angular/core';
import { ZwibblerClass, ZwibblerContext } from './zwibbler2';
declare let Zwibbler: ZwibblerClass;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'vidEdit';
  @ViewChild('zwibblerContainer', { read: ViewContainerRef }) container;
  //  video = document.querySelector("this.video");
  //  left = document.querySelector(".left");
  //  overlay = document.querySelector(".this.overlay");
  canvas: any;
  resolver: any;
  ctx: ZwibblerContext;
  constructor(private myElement: ElementRef) {}
  async ngOnInit() {  
   
    Zwibbler.controller("mycontroller", (scope) => {
      const video =<HTMLVideoElement> document.querySelector("video");
      const left = document.querySelector(".left");
      const overlay = <HTMLCanvasElement>document.querySelector(".overlay") ;
      video.controls = true;
      console.log(scope);
      scope.drawing = false;
      scope.notes = [];
      scope.selectedNote = null;
      scope.ctx.setConfig("adaptiveBrushWidth", true);
      scope.ctx.on("resize", () => {
          console.log("Resize!");
          let scale = left.clientWidth / video.videoWidth;
          if (scale * video.videoHeight > left.clientHeight) {
              scale = left.clientHeight / video.videoHeight;
          }
          console.log("videoWidth=%s clientWidth=%s scale=%s", video.videoWidth, left.clientWidth, scale);
          // make video same width as the container
          video.width = video.videoWidth * scale;
         overlay.width = left.clientWidth;
           overlay.height = left.clientHeight;
          scope.ctx.setDocumentSize(video.videoWidth * scale, video.videoHeight * scale);
          scope.ctx.setZoom(scale);
      });
      scope.addNote = () => {
          let note = {
              text: "",
              offset: video.currentTime,
              page: scope.ctx.addPage(),
          };
          scope.ctx.setCurrentPage(note.page);
          scope.notes = scope.notes.concat();
          scope.notes.push(note);
          scope.notes.sort((a, b) => {
              return a.offset - b.offset;
          });
          scope.gotoNote(note);
      };
      scope.stop = () => {
          if (!scope.drawing) {
              scope.addNote();
          }
      };
      scope.deleteNote = () => {
          if (scope.selectedNote) {
              scope.ctx.deletePage(scope.selectedNote.page);
              let found = false;
              scope.notes = scope.notes.concat();
              for (let i = 0; i < scope.notes.length; i++) {
                  if (found && scope.notes[i].page > scope.selectedNote.page) {
                      scope.notes[i].page -= 1;
                  }
                  else if (scope.notes[i] === scope.selectedNote) {
                      scope.notes.splice(i, 1);
                      i -= 1;
                      found = true;
                  }
              }
          }
          video.controls = true;
          scope.drawing = true;
          scope.selectedNote = null;
      };
      scope.gotoNote = (note) => {
          if (scope.selectedNote === note && scope.drawing) {
              return;
          }
          scope.selectedNote = note;
          scope.ctx.setCurrentPage(note.page);
          video.pause();
          video.currentTime = note.offset;
          video.controls = false;
          scope.drawing = true;
          scope.ctx.useBrushTool({
              strokeStyle: "orange",
              lineWidth: 3,
          });
      };
      scope.saveNote = () => {
          video.controls = true;
          scope.drawing = false;
          video.play();
      };
      function seeked() {
          if (scope.drawing) {
              return;
          }
          let offset = video.currentTime;
          let found = null;
          for (let note of scope.notes) {
              if (offset > note.offset && offset < note.offset + 10) {
                  found = note;
              }
          }
          console.log("Seeked to %s", offset, found, scope.notes);
          let ctx = overlay.getContext("2d");
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, overlay.width, overlay.height);
          let scale = video.width / video.videoWidth;
          ctx.setTransform(scale, 0, 0, scale, 0, 0);
          if (found) {
              scope.selectedNote = found;
              scope.$digest();
              scope.ctx.draw(ctx, {
                  page: found.page,
              });
          }
      }
      video.addEventListener("seeked", seeked);
      video.addEventListener("play", seeked);
      setInterval(() => {
          if (!scope.drawing && !video.paused) {
              seeked();
          }
      }, 500);
      let loaded = false;
      video.addEventListener("loadeddata", () => {
          console.log("Readystate %s", video.readyState);
          if (!loaded && video.readyState >= 3) {
              scope.ctx.resize();
              video.play();
              loaded = true;
          }
      });
      scope.test = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 500;
          canvas.height = 500;
          canvas.style.zIndex = "1000";
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "red";
          ctx.fillRect(0, 0, 500, 500);
          scope.ctx.draw(canvas.getContext("2d"), {
              page: scope.ctx.getCurrentPage(),
          });
          document.body.appendChild(canvas);
      };
      scope.round = (offset) => {
          return "@" + offset.toFixed(1) + "s";
      };
      scope.mysave = () => {
          scope.ctx.setDocumentProperty("notes", scope.notes);
          scope.ctx.download("zwibbler3", "video.zwibbler");
      };
      scope.myopen = () => {
          scope.ctx.openFromComputer("zwibbler").then(() => {
              scope.notes = scope.ctx.getDocumentProperty("notes");
          });
      };
      fetch("video.zwibbler").then((response) => {
          return response.text();
      }).then((SAVED) => {
          scope.ctx.load(SAVED);
          scope.notes = scope.ctx.getDocumentProperty("notes");
      });
  });
  console.log("Running script."); 
    }
     
 ngAfterViewInit(){
 
  let zwibblerDiv = this.myElement.nativeElement.querySelector("[zwibbler]")!;
  let scope = Zwibbler.attach(zwibblerDiv, {
  showPropertyPanel: false,
  showColourPanel: true,
  showToolbar: true,
  });
  this.ctx = scope.ctx;
  
  this.ctx.setConfig("allowSystemClipboard", true);
}
}




  

