import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import interact from 'interactjs';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements AfterViewInit {
  @ViewChild('draggable') draggable!: ElementRef;

  private minWidth = 0;
  private minHeight = 0;

  ngAfterViewInit() {
    const element = this.draggable.nativeElement;
    const parent = element.parentNode as HTMLElement;

    interact(element)
      .resizable({
        edges: { left: true, right: true, top: true, bottom: true },

        modifiers: [
          interact.modifiers.aspectRatio({ ratio: 'preserve' }),
          interact.modifiers.restrictEdges({ outer: parent }),
          interact.modifiers.restrictSize({
            min: {
              width: this.minWidth,
              height: this.minHeight
            }
          })
        ],

        listeners: {

          start: () => {
            parent.querySelectorAll('.clone').forEach(e => {
              (e as HTMLElement).style.display = 'none';
            });
          },

          move: (event) => {

            const rect = element.getBoundingClientRect();
            const parentRect = parent.getBoundingClientRect();

            const maxWidth = parentRect.right - rect.left;
            const maxHeight = parentRect.bottom - rect.top;

            const ratio = element.naturalWidth / element.naturalHeight;

            let newWidth = Math.min(event.rect.width, maxWidth);
            let newHeight = newWidth / ratio;

            // 🔥 BLOQUEIO DE TAMANHO MÍNIMO
            if (newWidth < this.minWidth) {
              newWidth = this.minWidth;
              newHeight = newWidth / ratio;
            }

            if (newHeight > maxHeight) {
              newHeight = maxHeight;
              newWidth = newHeight * ratio;
            }

            Object.assign(event.target.style, {
              width: `${newWidth}px`,
              height: `${newHeight}px`
            });
          },

          end: () => {
            parent.querySelectorAll('.clone').forEach(e => e.remove());
            this.replicateImages();
          }
        }
      });


    if (element.complete) {
      this.replicateImages();
    } else {
      element.onload = () => this.replicateImages();
    }
  }

  imprimir() {
    window.print();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const element = this.draggable.nativeElement as HTMLImageElement;
    const parent = element.parentNode as HTMLElement;

    parent.querySelectorAll('.clone').forEach(e => e.remove());

    const reader = new FileReader();

    reader.onload = () => {
      element.src = reader.result as string;

      element.onload = () => {
        element.style.width = '250px';
        element.style.height = 'auto';
        element.style.transform = 'none';

        this.minWidth = element.offsetWidth;
        this.minHeight = element.offsetHeight;

        this.replicateImages();
      };
    };

    reader.readAsDataURL(file);
  }

  replicateImages() {
    const element = this.draggable.nativeElement as HTMLImageElement;
    const parent = element.parentNode as HTMLElement;

    parent.querySelectorAll('.clone').forEach(e => e.remove());

    const rect = element.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    const imgWidth = rect.width;
    const imgHeight = rect.height;
    if (!imgWidth || !imgHeight) return;

    const areaWidth = parentRect.width;
    const areaHeight = parentRect.height;
    const gap = 10;

    const cols = Math.floor((areaWidth + gap) / (imgWidth + gap));
    const rows = Math.floor((areaHeight + gap) / (imgHeight + gap));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === 0 && c === 0) continue;

        const clone = element.cloneNode(true) as HTMLElement;
        clone.classList.add('clone');

        clone.style.position = 'absolute';
        clone.style.left = `${c * (imgWidth + gap)}px`;
        clone.style.top = `${r * (imgHeight + gap)}px`;
        clone.style.width = `${imgWidth}px`;
        clone.style.height = `${imgHeight}px`;
        clone.style.transform = 'none';

        parent.appendChild(clone);
      }
    }
  }
}
