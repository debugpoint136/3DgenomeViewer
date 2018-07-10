function LockedControls(control0, control1){
    this.control0 = control0;
    this.control1 = control1;
}

LockedControls.prototype.lock = function(){
    var self = this;
    var dom0 = this.control0.domElement;
    var dom1 = this.control1.domElement;
    
    dom0.addEventListener('mousedown', function(event){
        self.control1.onMouseDown(event);
    });
    dom0.addEventListener('mousewheel', function(event){
        self.control1.onMouseWheel(event);
    });
    dom0.addEventListener('DOMMouseScroll', function(event){
        self.control1.onMouseWheel(event);
    });
        
    dom1.addEventListener('mousedown', function(event){
        self.control0.onMouseDown(event);
    });
    dom1.addEventListener('mousewheel', function(event){
        self.control0.onMouseWheel(event);
    });
    dom1.addEventListener('DOMMouseScroll', function(event){
        self.control0.onMouseWheel(event);
    });
    
};









