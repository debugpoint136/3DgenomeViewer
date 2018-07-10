// This file contains the application-level logic for the 3D Chromatin Viewer.
// This includes managing model selection, and manipulating the styling and
// layout for models.

function ChromatinViewController(viewContainer, allModelsMetadata, initialExperiment, progressBar, onViewClose) {
    var self = this;

    var loadDataProgressShare = 40;
    var domUpdatePauseMilliSecs = 200;

    this.experiment = initialExperiment;
    this.sample = null;
    this.chromosome = null;
    this.level = null;
    this.controlPanel = null;
    this.onViewClose = onViewClose;

    var proteinSettings = {};

    this.cloneView = function() {
        console.log('we need to clone the view now');
    };

    // TODO width and height should not be hard coded
    var canvas = $(document.createElement('canvas'));
    canvas.attr('width', '1200px');
    canvas.attr('height', '800px');
    canvas.addClass('chromatin-view');

    var model = new ChromatinModel();
    this.viewer = new Viewer(canvas[0], model);
    this.viewer.init();

    var allowRender = true;
    function animate() {
        requestAnimationFrame(animate);
        if(allowRender && self.level !== null) {
            self.viewer.render();
            self.viewer.update();
            if(progressBar.getPercentComplete() !== 100) {
                progressBar.setPercentComplete(100);
                progressBar.setMessage(
                        'completed rendering ' +
                        self.experiment + ' ' +
                        self.sample + ' ' +
                        self.chromosome + ' at level ' +
                        self.level);
            }
        }
    }
    animate();

    // Commented out the next line because the model components aren't set
    // yet and null pointers were showing up in various places.
    // self.viewer.showModel();

    var gui = new dat.GUI({autoPlace: false});
    gui.add(this, 'onViewClose').name('Close View');
    var selectModelMenu = gui.addFolder('Select Model');

    var experimentCtrl = selectModelMenu.add(this, 'experiment', allModelsMetadata.experimentNames);
    experimentCtrl.onChange(experimentChanged);
    var sampleCtrl = null;
    var chrCtrl = null;
    var levelCtrl = null;

    var currUpdateID = 0;
    function updateModel() {
        model.clearModel();
        self.viewer.clearScene();
        allowRender = false;

        var updateID = ++currUpdateID;
        var coords = null;
        var interactions = null;
        var interpolationData = null;
        function maybeFinish() {
            if(coords !== null && interactions !== null
               && currUpdateID === updateID
               && (self.level !== '2' || interpolationData !== null)) {

                progressBar.setMessage(
                    'rendering model for ' +
                    self.experiment + ' ' +
                    self.sample + ' ' +
                    self.chromosome + ' at level ' +
                    self.level);

                // wait a bit to give the progress bar a chance to update
                setTimeout(function() {
                    model.clearModel();
                    model.setLevel(parseInt(self.level));
                    model.setChromosome(self.chromosome);
                    model.setClusters(coords.genomicCoords, coords.xyzPositions);
                    // performance doesn't yet seem to allow for interactions
                    // interactions.petInteractions.length = 100;
                    var proteinNames = allModelsMetadata.experiments[self.experiment].samples[self.sample].proteinFactors;
                    model.setInteractions(proteinNames, interactions.petInteractions);

                    if(interpolationData === null) {
                        model.setInterpolationClusters(null, null);
                    } else {
                        model.setInterpolationClusters(interpolationData.genomicCoords, interpolationData.xyzPositions);
                    }

                    self.viewer.clearScene();
                    self.viewer.showModel();
                    self.controlPanel.update();

                    var currPercentComplete = progressBar.getPercentComplete();
                    var percentRemaining = 100 - currPercentComplete;
                    progressBar.setPercentComplete(currPercentComplete + percentRemaining / 2);

                    // wait a bit to give the progress bar a chance to update
                    setTimeout(function () {
                        allowRender = true;
                    }, domUpdatePauseMilliSecs);
                }, domUpdatePauseMilliSecs);
            }
        }

        var loadDivisor = self.level === '2' ? 3 : 2;
        progressBar.setPercentComplete(10);
        progressBar.setMessage(
            'loading model for ' +
            self.experiment + ' ' +
            self.sample + ' ' +
            self.chromosome + ' at level ' +
            self.level);

        $.ajax({
            url: 'experiment-' + self.experiment +
                 '/sample-' + self.sample +
                 '/' + self.chromosome +
                 '/level-' + self.level +
                 '/coords.json',
            success: function(_coords) {
                if(updateID === currUpdateID) {
                    coords = _coords;
                    progressBar.setPercentComplete(progressBar.getPercentComplete() + loadDataProgressShare / loadDivisor);
                }
            },
            error: function() {
                console.error('failed to load metadata');
            }
        }).always(maybeFinish);

        $.ajax({
            url: 'experiment-' + self.experiment +
                 '/sample-' + self.sample +
                 '/' + self.chromosome +
                 '/pet-interactions.json',
            success: function(_interactions) {
                if(updateID === currUpdateID) {
                    interactions = _interactions;
                    progressBar.setPercentComplete(progressBar.getPercentComplete() + loadDataProgressShare / loadDivisor);
                }
            },
            error: function() {
                console.error('failed to load metadata');
            }
        }).always(maybeFinish);

        if(self.level === '2') {
            $.ajax({
                url: 'experiment-' + self.experiment +
                     '/sample-' + self.sample +
                     '/' + self.chromosome +
                     '/level-3' +
                     '/coords.json',
                success: function(_coords) {
                    if(updateID === currUpdateID) {
                        interpolationData = _coords;
                        progressBar.setPercentComplete(progressBar.getPercentComplete() + loadDataProgressShare / loadDivisor);
                    }
                },
                error: function() {
                    console.error('failed to load metadata');
                }
            }).always(maybeFinish);
        }
    }

    function levelChanged() {
        updateModel();
    }

    function chromosomeChanged() {
        updateModel();
    }

    function sampleChanged() {
        updateChrOptions();
        updateLevelOptions();

        updateModel();
    }

    function updateChrOptions() {
        var selectedExperiment = allModelsMetadata.experiments[self.experiment];
        var selectedSample = selectedExperiment.samples[self.sample];

        var chromosomeNames = selectedSample.chromosomeNames;
        if(chrCtrl === null) {
            chrCtrl = selectModelMenu.add(
                self,
                'chromosome',
                chromosomeNames
            );
        } else {
            chrCtrl = chrCtrl.options(chromosomeNames);
        }

        if(chromosomeNames.indexOf(self.chromosome) === -1) {
            self.chromosome = chromosomeNames.length ? chromosomeNames[0] : null;
        }
        chrCtrl.onChange(chromosomeChanged);
    }

    function updateLevelOptions() {
        var selectedExperiment = allModelsMetadata.experiments[self.experiment];
        var selectedSample = selectedExperiment.samples[self.sample];

        // for now we're hard-coding the levels
        //var levelCount = selectedSample.levelCount;
        var levelCount = 3;
        var levelLabels = [];
        for(var i = 0; i < levelCount; i++) {
            levelLabels.push(i);
        }
        if(levelCtrl === null) {
            levelCtrl = selectModelMenu.add(
                self,
                'level',
                levelLabels
            );
        } else {
            levelCtrl = levelCtrl.options(levelLabels);
        }

        if(levelLabels.indexOf(self.level) === -1) {
            self.level = 3;
        } else {
            levelCtrl.setValue(self.level);
        }
        levelCtrl.onChange(levelChanged);
    }

    function updateSampleOptions() {
        var selectedExperiment = allModelsMetadata.experiments[self.experiment];

        var sampleNames = selectedExperiment.sampleNames;
        if(sampleCtrl === null) {
            sampleCtrl = selectModelMenu.add(
                self,
                'sample',
                sampleNames
            );
        } else {
            sampleCtrl = sampleCtrl.options(sampleNames);
        }
        self.sample = sampleNames.length ? sampleNames[0] : null;
        sampleCtrl.onChange(sampleChanged);

        updateChrOptions();
        updateLevelOptions();
    }

    this.controlPanel = new ControlPanel(gui, self.viewer);

    function experimentChanged() {
        updateSampleOptions();
        updateModel();
    }
    experimentChanged();

    var guiDOMElem = $(gui.domElement);
    guiDOMElem.css({
        position: 'absolute',
        right: '0'
    });
    viewContainer.append(guiDOMElem);

    viewContainer.append(canvas);
}

function ProgressBar() {
    // We're building something like the following:
    // <div class="progress">
    //   <div class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100" style="width: 45%">
    //     <span>45% Complete</span>
    //   </div>
    // </div>
    this.mainDiv = $(document.createElement('div'));
    this.mainDiv.attr('class', 'progress');

    var progressBarDiv = $(document.createElement('div'));
    progressBarDiv.attr('class', 'progress-bar progress-bar-striped active');
    progressBarDiv.attr('role', 'progress');
    progressBarDiv.attr('aria-valuenow', 0);
    progressBarDiv.attr('aria-valuemin', 0);
    progressBarDiv.attr('aria-valuemax', 100);
    progressBarDiv.css('width', '0%');
    this.mainDiv.append(progressBarDiv);

    var labelSpan = $(document.createElement('span'));
    progressBarDiv.append(labelSpan);

    var percentComplete = 0;
    var message = null;

    this.setPercentComplete = function(_percentComplete) {
        percentComplete = _percentComplete;
        updateProgress();
    };

    this.getPercentComplete = function() {
        return percentComplete;
    };

    this.setMessage = function(_message) {
        message = _message;
        updateProgress();
    };

    function updateProgress() {
        var percentInt = Math.floor(percentComplete);
        var percentStr = percentInt + '%';

        if(percentInt < 100) {
            progressBarDiv.addClass('progress-bar-striped active');
        } else {
            progressBarDiv.removeClass('progress-bar-striped active');
        }

        if(message === undefined || message === null || message === '') {
            labelSpan.text(percentStr);
        } else {
            labelSpan.text(percentStr + ': ' + message);
        }
        progressBarDiv.attr('aria-valuenow', percentInt);
        progressBarDiv.css('width', percentStr);
    }
}

/**
* Creates UI for a single chromatin model
* @param multiViewContainer the div that we will inject the view into
* @param createViewButtonGroup button group control that allows the user to add views
* @constructor
*/
function init3DChromatinApp(multiViewContainer, createViewButtonGroup, lockViewsButton) {

    var selectedExperimentName = null;
    var allModelsMetadata = null;
    var viewsPerRow = 2;
    var viewColClass = 'col-md-' + Math.floor(12 / viewsPerRow);
    var chromatinViews = [];
    var viewColumns = [];

    var currRowDiv = null;

    function appendNewRow() {
        var rowDiv = $(document.createElement('div'));
        rowDiv.addClass('row');
        multiViewContainer.append(rowDiv);

        return rowDiv;
    }

    function createModelView() {
        if(viewsAreLocked()) {
            unlockViews();
        }
        lockViewsButton.prop('disabled', chromatinViews.length === 0);

        var currViewIndex = chromatinViews.length;
        if(selectedExperimentName === null) {
            return;
        }

        if(currViewIndex % viewsPerRow === 0) {
            currRowDiv = appendNewRow();
        }

        var currViewCol = $(document.createElement('div'));
        if(currViewIndex === 0) {
            currViewCol.attr('class', 'col-md-12');
        } else {
            if(currViewIndex === 1) {
                viewColumns[0].attr('class', viewColClass);
            }
            currViewCol.attr('class', viewColClass);
        }
        viewColumns.push(currViewCol);

        currRowDiv.append(currViewCol);

        //currViewCol.append($('<div class="progress"><span class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100" style="width: 75%"><span class="sr-only">45% Complete</span></span><div>45% yall</div></div>'));
        var progressBar = new ProgressBar();
        currViewCol.append(progressBar.mainDiv);

        var currViewContainer = $(document.createElement('div'));
        currViewContainer.addClass('chrom-view-container');
        currViewCol.append(currViewContainer);

        function onViewClose() {
            if(viewsAreLocked()) {
                unlockViews();
            }
            lockViewsButton.prop('disabled', chromatinViews.length <= 2);

            var currViewIndex = viewColumns.indexOf(currViewCol);
            multiViewContainer.empty();
            chromatinViews.splice(currViewIndex, 1);
            viewColumns.splice(currViewIndex, 1);

            viewColumns.forEach(function(viewCol, i) {
                if(i % viewsPerRow === 0) {
                    currRowDiv = appendNewRow();
                }

                currRowDiv.append(viewCol);
                if(chromatinViews.length === 1) {
                    viewCol.attr('class', 'col-md-12');
                }
            });
        }
        chromatinViews.push(new ChromatinViewController(
            currViewContainer,
            allModelsMetadata,
            selectedExperimentName,
            progressBar,
            onViewClose
        ));
    }

    function initCreateViewButtonGroup() {
        var createViewButton = createViewButtonGroup.find('.create-view-btn');
        var experimentDropdownMenu = createViewButtonGroup.find('.experiment-dropdown-menu');
        var experimentDropdownLabel = createViewButtonGroup.find('.experiment-dropdown-label');

        function selectExperimentName(experimentName) {
            selectedExperimentName = experimentName;
            experimentDropdownLabel.text('Selected Experiment: ' + experimentName);
        }

        allModelsMetadata.experimentNames.forEach(function(currExperimentName) {
            var currLI = $(document.createElement('li'));
            var currAHref = $(document.createElement('a')).click(function() {
                selectExperimentName(currExperimentName);
            });
            currAHref.attr('href', '#');
            currAHref.text(currExperimentName);
            currLI.append(currAHref);
            experimentDropdownMenu.append(currLI);
        });

        createViewButton.click(function() {
            createModelView();
        });

        if(allModelsMetadata.experimentNames.length) {
            selectExperimentName(allModelsMetadata.experimentNames[0]);
        }
    }

    $.ajax({
        url: 'all-models-metadata.json',
        success: function(_allModelsMetadata) {
            allModelsMetadata = _allModelsMetadata;
            initCreateViewButtonGroup();
            createModelView(0);
        },
        error: function() {
            console.error('failed to load metadata');
        }
    });

    function lockViews() {
        lockViewsButton.addClass('active');

        var viewers = chromatinViews.map(function(chromatinViewController) {
            return chromatinViewController.viewer;
        });

        // call function to lock viewers here
        console.log('locking viewers:');
        console.log(viewers);

        var lockedControls = new LockedControls(viewers[0].controls, viewers[1].controls);
        lockedControls.lock();
    }

    function unlockViews() {
        lockViewsButton.removeClass('active');

        // call function to unlock all viewers here
        console.log('unlocking viewers');
    }

    function viewsAreLocked() {
        return lockViewsButton.hasClass('active');
    }

    lockViewsButton.click(function() {
        // toggle the locked state of views
        if(viewsAreLocked()) {
            unlockViews();
        } else {
            lockViews();
        }
    });

}
