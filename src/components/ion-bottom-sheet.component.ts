import { Component, Input, ElementRef, Renderer2, Output, EventEmitter, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { Platform, DomController} from '@ionic/angular';
import { SheetState } from './ion-bottom-sheet-state';
import * as Hammer from 'hammerjs';
 
@Component({
  selector: 'ion-bottom-sheet',
  templateUrl: './ion-bottom-sheet.component.html',
  styleUrls: ['./ion-bottom-sheet.component.scss']
})
export class IonBottomSheetComponent implements AfterViewInit, OnChanges {
  @Input() dockedHeight: number = 200;
  @Input() minHeight: number = 0;
  @Input() topDistance: number = 0;
  @Input() bounceDelta: number = 30;
  @Input() canBounce: Boolean = true;
  @Input() roundBorder: Boolean = true;
  @Input() roundBorderOnTop: Boolean = false;
  @Input() shadowBorder: Boolean = true;
  @Input() shadowBorderOnTop: Boolean = false;
  @Input() disableDrag: Boolean = false;
  @Input() hideCloseButton: Boolean = false;
  @Input() hideCloseButtonOnTop: Boolean = false;
  @Input() hideDragIcon: Boolean = false;
  @Input() hideDragIconOnTop: Boolean = false;
  @Input() hideTitle: Boolean = false;
  @Input() hideHeader: Boolean = false;
  @Input() hideSeparator: Boolean = false;
  @Input() titleCentered: Boolean = false;
  @Input() titleSize: string = "20px";
  @Input() titleFamily: string = "inherit";
  @Input() transition: string = '0.25s ease-out';
  @Input() state: SheetState = SheetState.Bottom;
  @Input() title: string = "Header Title";
  @Input() enableScrollContent: Boolean = false;
  @Input() enableScrollContentOnlyOnTop: Boolean = false;
  @Input() enableShadowHeaderOnScrolling: Boolean = true;
  @Input() useSmoothScrolling: Boolean = true;
  @Input() restoreScrollOnWhenChangeState: string = "none";
  
  @Output() stateChange: EventEmitter<SheetState> = new EventEmitter<SheetState>();

  private _startPosition: number;
  private _startScroll: number = 0;
  private _sheetTopAnimationHasBeenPerformed: Boolean = false;
  private _bottomShadowHeaderHasBeenPerformed: Boolean = false;
  private _scrollUpContentCheckHasBeenPerformed: Boolean = false;
  private _scrollContent: Boolean = this.enableScrollContent && !this.enableScrollContentOnlyOnTop;
  private _dyInitialScrollDown: number = 0;
  private _dyInitialScrollUp: number = 0;

  constructor(
    private _element: ElementRef,
    private _renderer: Renderer2,
    private _domCtrl: DomController,
    private _platform: Platform,
  ) {
    this._adjustForShadow();
  }

  /*********************************************************************************************************/
  /* Ng interface implements */
  /*********************************************************************************************************/

  ngAfterViewInit() {
    this._loadEvents();
    this._loadCssStyle();
    this._loadContentGesture();
    this._loadHeaderGesture();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes.state) { return; }
    this._restoreNativeContentSize();
    this._restoreScrolling(changes.state.previousValue, changes.state.currentValue);
    this._enableTransition();
    this._setSheetState(changes.state.currentValue);
  }

  /*********************************************************************************************************/
  /* Base class methods                                                                                    */
  /*********************************************************************************************************/

  private _loadHeaderGesture(){
    if (this.disableDrag) { return; }
    let target = this.enableScrollContent ? this._element.nativeElement.querySelector("#ibs-header") :this._element.nativeElement;
    const headerGesture = new Hammer(target);
    headerGesture.get('pan').set({ enable: true, direction: Hammer.DIRECTION_VERTICAL });
    headerGesture.on('panstart', () => this._onHeaderGestureStart()); 
    headerGesture.on('panend', (ev) => this._onHeaderGestureEnd(ev));
    headerGesture.on('pan', (ev) => this._onHeaderGestureMove(ev));
  }

  private _loadContentGesture(){
    if (!this.enableScrollContent){ return; }
    const contentGesture = new Hammer(this._element.nativeElement.querySelector("#ibs-content-inner"));
    contentGesture.get('pan').set({ enable: true, direction: Hammer.DIRECTION_VERTICAL });
    contentGesture.on('panstart', () => this._onContentGestureStart()); 
    contentGesture.on('panend', (ev) => this._onContentGestureEnd(ev));
    contentGesture.on('pan', (ev) => this._onContentGestureMove(ev));
  }

  private _adjustForShadow(){
    if (!this.shadowBorder) { return; }
    if (this.minHeight > 0 ) { return; }
    this.minHeight = this.minHeight - 10;
  }

  private _loadEvents(){
    if (!this.hideCloseButton) {
      this._renderer.listen(this._element.nativeElement.querySelector("#close-button"), "click", this.closeSheet.bind(this));
    }
  
    if (this.disableDrag) { return; }
    this._renderer.listen(this._element.nativeElement, "transitionend", this._checkForAnimationOnTop.bind(this));

    if (!this.canBounce) { return; }

    if (this.enableScrollContent) {
      this._renderer.listen(this._element.nativeElement, "transitionend", this._checkForScrolling.bind(this));
      this._renderer.listen(this._element.nativeElement.querySelector("#ibs-content-inner"), "scroll", this._contentShadowOnScroll.bind(this));
    }

    if (this.enableScrollContent && !this.enableScrollContentOnlyOnTop) {
      this._renderer.listen(this._element.nativeElement, "transitionend", this._changeNativeContentSize.bind(this));
    }
  }

  private _loadCssStyle(){
    this._cssAutoManageClass("no-close-btn", this.hideCloseButton, this._element.nativeElement);
    this._cssAutoManageClass("no-drag-icon", this.hideDragIcon, this._element.nativeElement);
    this._cssAutoManageClass("no-title", this.hideTitle, this._element.nativeElement);
    this._cssAutoManageClass("no-header", this.hideHeader, this._element.nativeElement);
    this._cssAutoManageClass("separator", !this.hideSeparator, this._element.nativeElement.querySelector("#ibs-header"));
    this._cssAutoManageClass("round-border", this.roundBorder, this._element.nativeElement.querySelector("#ibs-container"));
    this._cssAutoManageClass("shadow-border", this.shadowBorder, this._element.nativeElement.querySelector("#ibs-container"));
    this._cssAutoManageClass("txt-center", this.titleCentered, this._element.nativeElement.querySelector("#title"));
    this._cssAutoManageClass("pd5", this.enableShadowHeaderOnScrolling, this._element.nativeElement.querySelector("#ibs-content"));
    this._setStyle("font-size", this.titleSize, this._element.nativeElement.querySelector("#title"));
    this._setStyle("font-family", this.titleFamily, this._element.nativeElement.querySelector("#title"));
  }

  private _setSheetState(state: SheetState) {
    switch (state) {
      case SheetState.Bottom:
        this._setTranslateY('calc(100vh - ' + this.minHeight + 'px)'); break;
      case SheetState.Docked:
        this._setTranslateY('calc(100vh - ' + this.dockedHeight + 'px)'); break;
      case SheetState.Top:
        this._setTranslateY(this.topDistance + 'px'); break;
    }
  }
  
  private _getPosition(currentState: SheetState): number{
    switch (currentState) {
      case SheetState.Bottom:
        return this._platform.height() - this.minHeight;
      case SheetState.Docked:
        return this._platform.height() - this.dockedHeight;
      case SheetState.Top:
        return this.topDistance;
    }
  }

  private _nextSate(currentState: SheetState, gestureDirection: number): number{
    switch (currentState) {
      case SheetState.Bottom:
        return gestureDirection < 0 ? SheetState.Docked : SheetState.Bottom;
      case SheetState.Docked:
        return gestureDirection < 0 ? SheetState.Top : SheetState.Bottom;
      case SheetState.Top:
        return gestureDirection < 0 ? SheetState.Top : SheetState.Docked;
    }
  }

  private _checkForScrolling(){
    // initialize up and down scroll initial values
    this._dyInitialScrollUp = this._dyInitialScrollDown = 0;
    
    if (this._element.nativeElement.getBoundingClientRect().y == this._getPosition(SheetState.Top)){
      this._scrollContent = this.enableScrollContent;
      return;
    }

    this._scrollContent = this.enableScrollContent && !this.enableScrollContentOnlyOnTop;
  }

  private _checkForAnimationOnTop(){
    if (this._element.nativeElement.getBoundingClientRect().y == this._getPosition(SheetState.Top)){
      if (this._sheetTopAnimationHasBeenPerformed) { return; }
      this._sheetTopAnimationHasBeenPerformed = true;
      this._scrollContent = this.enableScrollContent;
    }else{
      if (!this._sheetTopAnimationHasBeenPerformed) { return; }
      this._sheetTopAnimationHasBeenPerformed = false;
      this._scrollContent = false;
    }

    if (!this.roundBorderOnTop && this.roundBorder) {
      this._cssAutoManageClass("round-border", !this._sheetTopAnimationHasBeenPerformed, this._element.nativeElement.querySelector("#ibs-container"));
    }
    
    if (!this.shadowBorderOnTop && this.shadowBorder) {
      this._cssAutoManageClass("shadow-border", !this._sheetTopAnimationHasBeenPerformed, this._element.nativeElement.querySelector("#ibs-container"));
    }

    if (this.hideDragIconOnTop && !this.hideDragIcon) {
      this._cssSwitchClass(this._sheetTopAnimationHasBeenPerformed ? "fadeOut" : "fadeIn", this._sheetTopAnimationHasBeenPerformed ? "fadeIn" : "fadeOut",  this._element.nativeElement.querySelector("#drag-icon"));
    }

    if (this.hideCloseButtonOnTop && !this.hideCloseButton) {
      this._cssSwitchClass(this._sheetTopAnimationHasBeenPerformed ? "fadeOut" : "fadeIn", this._sheetTopAnimationHasBeenPerformed ? "fadeIn" : "fadeOut",  this._element.nativeElement.querySelector("#close-button"));
    }
  }

  private _cssSwitchClass(entryClassName, exitClassName, selector) {
    this._cssRemoveClass(exitClassName, selector);
    this._cssAddClass(entryClassName, selector);
  }

  private _cssAutoManageClass(className:string, isToaddClass:Boolean, selector:HTMLBaseElement){
    this._domCtrl.write(() => { isToaddClass ? this._cssAddClass(className, selector) : this._cssRemoveClass(className, selector) });
  }

  private _cssAddClass(className:string, selector:HTMLBaseElement){
    this._domCtrl.write(() => this._renderer.addClass(selector, className) );
  }

  private _cssRemoveClass(className:string, selector: HTMLBaseElement){
    this._domCtrl.write(() => this._renderer.removeClass(selector, className) );
  }

  private _setStyle(property:string, value:string, selector:HTMLBaseElement){
    this._domCtrl.write(() => this._renderer.setStyle(selector, property, value) );
  }

  private _enableTransition(){
    this._setStyle('transition', this.transition, this._element.nativeElement);
  }

  private _disableTransition(){
    this._setStyle('transition', "none", this._element.nativeElement);
  }

  private _restoreScrolling(oldState:SheetState, newState: SheetState) {
    if (!this.enableScrollContent) { return; }
    if (this.restoreScrollOnWhenChangeState == "none") { return; }
    let isToRestore: Boolean = false;
    if (this.restoreScrollOnWhenChangeState == "always") {
      isToRestore = true
    }else{
      let states: string[] = this.restoreScrollOnWhenChangeState.replace(/ /g,'').split(">");
      let selectedNewState = states[states.length-1].charAt(0).toUpperCase() + states[states.length-1].slice(1);
      let selectedOldState = states[0].charAt(0).toUpperCase() + states[0].slice(1);

      if (SheetState[selectedNewState] == newState){
        if (selectedOldState == selectedNewState){
          isToRestore = true;
        }else {
            isToRestore = (SheetState[selectedOldState] == oldState);
        }
      }
    }
    
    if (isToRestore){
      this._element.nativeElement.querySelector("#ibs-content-inner").scroll({ top: 0, behavior: this.useSmoothScrolling ? 'smooth' : 'auto'});
    }
  }

  private _restoreNativeContentSize(){
    if (!this._scrollContent) { return; }
    let newContentHeight = "calc(100vh - " + (this.topDistance + this._getHeaderHeight()) + "px)";
    this._setStyle("height", newContentHeight, this._element.nativeElement.querySelector("#ibs-content"));
  }

  private _changeNativeContentSize(){
    if (!this._scrollContent) { return; }
    let newContentHeight = "calc(100vh - " + (this._element.nativeElement.getBoundingClientRect().y + this._getHeaderHeight()) + "px)";
    this._setStyle("height", newContentHeight, this._element.nativeElement.querySelector("#ibs-content"));
    this._autoEnableContentScroll();
  }

  private _getHeaderHeight(){
    return this.hideHeader ? 0 : this._element.nativeElement.querySelector("#ibs-header").getBoundingClientRect().height;
  }

  private _autoEnableContentScroll(){
    this._domCtrl.read(() => {
      let contentInnerScrollHeight = this._element.nativeElement.querySelector("#ibs-content-inner").scrollHeight;
      let contentHeight = this._element.nativeElement.querySelector("#ibs-content").getBoundingClientRect().height;
      this._scrollContent = (contentHeight - contentInnerScrollHeight < 0) && !this.enableScrollContentOnlyOnTop;
    });
  }

  private _contentShadowOnScroll(){
    if (this._element.nativeElement.querySelector("#ibs-content-inner").scrollTop > 0){
      if (this._bottomShadowHeaderHasBeenPerformed) { return; }
      this._bottomShadowHeaderHasBeenPerformed = true;
    }else{
      if (!this._bottomShadowHeaderHasBeenPerformed) { return; }
      this._bottomShadowHeaderHasBeenPerformed = false;
    }

    if (this.enableShadowHeaderOnScrolling){
      this._cssAutoManageClass("bottom-header-shadow", this._bottomShadowHeaderHasBeenPerformed, this._element.nativeElement.querySelector("#ibs-header"));
    }
  }
 
  private _setTranslateY(value) {
    this._setStyle('transform', 'translateY(' + value + ')', this._element.nativeElement);
  }

  closeSheet(){
    this.stateChange.emit(this.state = SheetState.Bottom);
  }

  /*********************************************************************************************************/
  /* Gestures                                                                                              */
  /*********************************************************************************************************/

  private _onHeaderGestureStart(){
    this._startPosition = this._element.nativeElement.getBoundingClientRect().y;
    this._disableTransition();
    this._restoreNativeContentSize();
  }

  private _onHeaderGestureEnd(ev, dyInitial=0){
    if (!this.canBounce) { 
      this._restoreNativeContentSize();
      if (this.enableScrollContent) { this._checkForScrolling(); }
      if (this.enableScrollContent && !this.enableScrollContentOnlyOnTop) { this._changeNativeContentSize(); }
      return; 
    }

    if ( Math.abs(ev.deltaY-dyInitial) > this.bounceDelta){
      this.stateChange.emit(this.state = this._nextSate(this.state, ev.deltaY-dyInitial));
    }else{
      this._enableTransition();
      this._setTranslateY(this._getPosition(this.state) + "px");
    }
  }

  private _onHeaderGestureMove(ev, dyInitial=0){
    let nextYposition = this._startPosition + ev.deltaY - dyInitial;

    if ( (nextYposition <= this._getPosition(SheetState.Top) ) && ( (ev.deltaY - dyInitial) < 0) ){
      nextYposition = this._getPosition(SheetState.Top);
    }

    if ((nextYposition >= this._getPosition(SheetState.Bottom)) && ( (ev.deltaY - dyInitial) > 0)){
      nextYposition = this._getPosition(SheetState.Bottom);
    }
    
    this._setTranslateY(nextYposition + "px");
    this._changeNativeContentSize();
    this._checkForAnimationOnTop();
  }

  private _onContentGestureStart(){
    if (!this._scrollContent && !this.disableDrag) { this._onHeaderGestureStart(); return; }
    this._startScroll = this._element.nativeElement.querySelector("#ibs-content-inner").scrollTop;
  }

  private _onContentGestureEnd(ev){
    if (!this._scrollContent && !this.disableDrag) { this._onHeaderGestureEnd(ev, this._dyInitialScrollDown); return; }
    // initialize up and down scroll initial values
    this._dyInitialScrollUp = this._dyInitialScrollDown = 0;
    // restore performance scroll flag 
    this._scrollUpContentCheckHasBeenPerformed = false;
    // define scroll math function
    let currentScrollPosition = this._element.nativeElement.querySelector("#ibs-content-inner").scrollTop;
    let speed = - Math.sign(ev.deltaY) * (Math.exp(Math.round(Math.abs(ev.velocityY))) - 1);
    let mP = this.useSmoothScrolling ? speed * Math.abs(ev.deltaY) : 0;
    let nextScroll = currentScrollPosition + mP;
    // scroll
    this._element.nativeElement.querySelector("#ibs-content-inner").scroll({ top: nextScroll, behavior: this.useSmoothScrolling ? 'smooth' : 'auto'});
  }

  private _onContentGestureMove(ev){
    if (!this._scrollContent && !this.disableDrag) { this._onHeaderGestureMove(ev, this._dyInitialScrollDown); return; }

    // get Delta Y before scrolling
    if ( (this.state != SheetState.Top) && (ev.deltaY < 0) && (!this._scrollUpContentCheckHasBeenPerformed) ) {
      this._dyInitialScrollUp = ev.deltaY;
      this._scrollUpContentCheckHasBeenPerformed = true;
    }

    let nextScroll = this._startScroll - ev.deltaY + this._dyInitialScrollUp;
    
    // stop scroll and move all sheet down / up
    if ((nextScroll <= 0 ) && (ev.deltaY - this._dyInitialScrollUp > 0)) {
      this._onHeaderGestureStart();
      this._scrollContent = false;
      nextScroll = 0;
      this._dyInitialScrollUp = 0;
      // get Delta Y before moving sheet
      this._dyInitialScrollDown = ev.deltaY;
      this._scrollUpContentCheckHasBeenPerformed = false;
    }
    
    this._element.nativeElement.querySelector("#ibs-content-inner").scroll(0, nextScroll);
  }
}