var log = {
    info: function (info) { 
        console.log('...Info...: ' + info + ' ' + new Date());
    },
    warning:function (warning) { 
        console.log('Warning: ' + warning);
    },
    error:function (error) { 
        console.log('Error: ' + error);
    }
};

module.exports = log