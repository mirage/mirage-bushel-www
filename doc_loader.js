var opamdoc_contents = '#opamdocroot'

// utility - Fetch HTML from URL using ajax
function ajax(url, cont){
    console.log('AJAX request : ' + url);
    $.ajax({
        type: 'GET',
        url:url,
        async:true,
        dataType: 'html'
    }).done(function(data){
        cont($(data));
    }).fail(function(){
        console.log('AJAX request failed : ' + url);
    });
}

function isLIdent(ident) {
    var chr = ident.charAt(0);
    return (chr !== chr.toUpperCase()
            && chr === chr.toLowerCase())
}

var url_regexp = /^(.*)\/([^/]*)\/(?:#(.*))?$/

function Path(url){

    this.package = null;
    this.module = null;
    this.subnames = [];
    this.subkinds = [];

    var match = url_regexp.exec(url);

    var base = match[1];
    var package = match[2];
    var hash = match[3];

    if(base === ocaml_base) {

      this.package = package;

      if(typeof hash !== 'undefined' && hash !== '') {
          var modstring = hash;
          var names = [];
          var kinds = [];
          var done = false;
          var sep = '.'
          var i = 0;
          while(!done) {
              var dot_index = modstring.indexOf('.');
              var colon_index = modstring.indexOf(':');
              if(dot_index > 0 && (dot_index < colon_index || colon_index < 0)) {
                  names[i] = modstring.substring(0, dot_index);
                  if(sep === ':') {
                    kinds[i] = 'modtype';
                  } else if(isLIdent(names[i])) {
                    kinds[i] = 'class';
                  } else {
                    kinds[i] = 'module';
                  }
                  sep = '.';
                  modstring = modstring.substring(dot_index + 1);
              } else if(colon_index > -1) {
                  names[i] = modstring.substring(0, colon_index);
                  if(sep === ':') {
                    kinds[i] = 'modtype';
                  } else if(isLIdent(names[i])) {
                    kinds[i] = 'class';
                  } else {
                    kinds[i] = 'module';
                  }
                  sep = ':';
                  modstring = modstring.substring(colon_index + 1);
              } else {
                  names[i] = modstring;
                  if(sep === ':') {
                    kinds[i] = 'modtype';
                  } else if(isLIdent(names[i])) {
                    kinds[i] = 'class';
                  } else {
                    kinds[i] = 'module';
                  }
                  done = true;
              }
              i++;
          }
          this.module = names[0];
          if(names.length > 1) {
              this.subnames = names.splice(1);
              this.subkinds = kinds.splice(1);
          }
      }
  }
}

Path.prototype.name = function () {
    var name = null;
    if(this.package !== null) {
        name = this.package;
        if(this.module !== null) {
            name = this.module;
            if(this.subnames.length > 0){
                name += '.' + this.subnames.join('.');
            } 
        }
    }        
    return name;
}

Path.prototype.url = function () { 
    var url = null;
    if(this.package !== null) {
        url = ocaml_base + '/' + this.package;
        if(this.module !== null) {
            url += '/#' + this.module;
            for(var i = 0; i < this.subnames.length; i++) {
                if(this.subkinds[i] === 'modtype') {
                    url += ':' + this.subnames[i];
                } else {
                    url += '.' + this.subnames[i];
                }
            } 
        }
    }        
    return url;
}

function Copy(path) {
    this.package = path.package;
    this.module = path.module;
    this.subnames = path.subnames.slice(0);
    this.subkinds = path.subkinds.slice(0);
}

Copy.prototype = Path.prototype

Path.prototype.copy = function () { return new Copy(this) }

Path.prototype.extend = function (name, kind) { 
    this.subnames[this.subnames.length] = name;
    this.subkinds[this.subkinds.length] = kind;
}

Path.prototype.substitute = function (from, to) {
    if(this.package === from.package) {
        if(this.module === from.module) {
            if(this.subnames.length > from.subnames.length) {
                var equal = true;
                for(var i = 0; i < from.subnames.length; i++) {
                    if(from.subnames[i] !== this.subnames[i]) {
                        equal = false;
                    } else if(from.subkinds[i] !== this.subkinds[i]) {
                        equal = false;
                    }
                }
                if(equal) {
                    this.package = to.package;
                    this.module = to.module;
                    var subnames = to.subnames.slice(0);
                    var subkinds = to.subkinds.slice(0);
                    for(var i = from.subnames.length; i < this.subnames.length; i++) {
                        subnames[subnames.length] = this.subnames[i];
                        subkinds[subkinds.length] = this.subkinds[i];
                    }
                    this.subnames = subnames;
                    this.subkinds = subkinds;
                    return true;
                }
            }
        }
    }
    return false;
}

function Parent(path) {
    this.package = null;
    this.module = null;
    this.subnames = [];
    this.subkinds = [];

    if(path.package !== null) {
        if(path.module !== null) {
            this.package = path.package;
            if(path.subnames.length > 0) {
                this.module = path.module;
                this.subnames = path.subnames.slice(0, -1);
                this.subkinds = path.subkinds.slice(0, -1);
            }
        } 
    }
}

Parent.prototype = Path.prototype

Path.prototype.parent = function () { return new Parent(this) }

function PathVisitor(path) {
    this.path = path;
    this.subnames = path.subnames.slice(0);
    this.subkinds = path.subkinds.slice(0);
}

PathVisitor.prototype.current = function (){
    if(this.subnames.length > 0) {
        return {kind: this.subkinds[0], name: this.subnames[0]};
    } else {
        return null;
    }
}

PathVisitor.prototype.next = function (){
    if(this.subnames.length > 0) {
        this.subnames.shift();
        this.subkinds.shift();
    }
    return this;
}

PathVisitor.prototype.concat = function(pv){
    this.subnames = this.subnames.concat(pv.subnames);
    this.subkinds = this.subkinds.concat(pv.subkinds);
    this.path.subnames = this.path.subnames.concat(pv.subnames);
    this.path.subkinds = this.path.subkinds.concat(pv.subkinds);

    return this;
}


function Page(path, kind){
    this.path = path;
    this.kind = kind;
    this.alias = null;
    this.summary = null;
    this.body = null;
    this.constraints = null;
    this.typ = null;
}

Page.prototype.parent_link = function() {
    var parent = this.path.parent();
    var title = parent.name();
    var url = parent.url();
    if (title === null || url === null) {
        title = this.path.name();
        url = ocaml_base + '/';
        $('#bccurpkg').attr('class','current').html(this.path.name());
        $('#bccurpkgmod').attr('class','hide');
    } else {
        $('#bccurpkg').attr('class','').html(
          $('<a>', {title: title, href: url, text: title }));
        $('#bccurpkg').attr('class','');
        $('#bccurpkgmod').attr('class','current');
        $('#bccurpkgmod').html(this.path.name ());
    }
}

Page.prototype.title = function(){
    var name = this.path.name();
    if(this.kind === 'module') {
        fullName = 'Module ' + name;
    } else if(this.kind === 'modtype') {
        fullName = 'Module type ' + name;
    } else if(this.kind === 'class') {
        fullName = 'Class ' + name;
    } else {
        fullName = 'Package ' + name;
    }

    var alias = null;
    var sep = '';
    if(this.alias !== null) {
        if(this.path.modtype !== null) {
          sep = ' = ';
        } else {
          sep = ' : ';
        }
        alias = $('<a>', 
                  {href    : this.alias.url(),
                   text    : this.alias.name()});
    }
     
    return $('<h1>')
        .addClass('ocaml_title')
        .append(fullName + sep)
        .append(alias);
}

function display_page(page){
    page.parent_link();
    var title = page.title();
    var summary = page.summary;
    var head = $('<div>')
        .addClass('panel')
        .addClass('callout')
        .append(title)
        .append(summary);
    var rule = $('<hr/>').attr('width','100%');
    var body = $('<div>')
        .addClass('column')
        .addClass('small-12')
        .addClass('medium-11')
        .addClass('large-9')
        .addClass('ocaml_body')
        .append(page.body);

    var content = $('<div>')
        .addClass('ocaml_page')
        .append(head)
        .append(body);

    $(opamdoc_contents).html(content);
}

function show_type(typ) {
    if(typ !== null) {
        var types = $('pre > span.TYPE'+typ).filter(':visible');
        if (types.length == 0){
            types = $('pre > code > span.TYPE'+typ).filter(':visible');;
        }
        if (types.length > 0) {
            var pos = types.position().top - (window.innerHeight / 5);
            if(pos < 0) {
                pos = 0;
            }
            window.scrollTo(0, pos);
            types.css('background', 'yellow');
        }
    }
}

function load_page(page, pv, input, cont) {

    var current = pv.current();
    var data = $('> div.ocaml_content', input);

    if(current === null) {
        page.summary = $('> div.ocaml_summary', input);
        page.body = data;
        if(page.path !== pv.path) {
            page.alias = pv.path
        }
        cont(page);
    } else {

        var kind = current.kind;
        var name = current.name;

        var query = '> div.ocaml_' + kind + '[name=' + name + ']'
        var subdata = $(query, data)

        if(subdata.length === 0) {

            var try_type = (kind === 'class');

            var includes = $('> div.ocaml_include', data);

            for (var i = 0; i < includes.length; i++){

                var items = JSON.parse($(includes[i]).attr('items'));

                if (items.indexOf(name) !== -1){
                    try_type = false;

                    var pathAttr = $(includes[i]).attr('path');

                    if (typeof pathAttr === 'undefined'){
                        load_page(page, pv, includes[i], cont);
                    } else {
                        var include_path = new Path(pathAttr);
                        var include_pv = new PathVisitor(include_path);

                        var include_url = ocaml_base + '/' + include_path.package + '/' + include_path.module +'.html'
                        
                        ajax(include_url, function(data){
                            load_page(page, include_pv.concat(pv), data, cont);
                        });
                    }
                }
            }

            if(try_type) {
                var types = $('pre > span.TYPE'+name, data);
                if (types.length == 0){
                    types = $('pre > code > span.TYPE'+name, data);
                }
                if (types.length > 0){
                    page.summary = $('> div.ocaml_summary', input);
                    page.body = data;
                    page.typ = name;
                    if(page.path !== pv.path) {
                        page.alias = pv.path.parent();
                    }
                    page.path = page.path.parent();
                    cont(page);
                } else {
                    for (var i = 0; i < includes.length; i++){
                        var items = JSON.parse($(includes[i]).attr('types'));
                        if (items.indexOf(name) !== -1){
                            page.summary = $('> div.ocaml_summary', input);
                            page.body = data;
                            page.typ = name;
                            if(page.path !== pv.path) {
                                page.alias = pv.path.parent();
                            }
                            page.path = page.path.parent();
                            cont(page);
                        }
                    }
                }
            }

        } else {
            page.kind = kind;

            var pathAttr = subdata.attr('path');

            if (typeof pathAttr === 'undefined'){
                load_page(page, pv.next(), subdata, cont);
            } else {
               
                var alias_path = new Path(pathAttr);
                var alias_pv = new PathVisitor(alias_path);

                var alias_url = ocaml_base + '/' + alias_path.package + '/' + alias_path.module +'.html'

                ajax(alias_url, function(data){
                    load_page(page, alias_pv.concat(pv.next()), data, cont);
                });
            }
        }
    }
}

function load_path(path, cont) {
    if(path.module !== null) {
        var url = ocaml_base + '/' + path.package + '/' + path.module + '.html';
        ajax(url, function(data){
            var pg = new Page(path, 'module');
            var pv = new PathVisitor(path);
            
            load_page(pg, pv, data, cont);
        });
    } else {
        var url = ocaml_base + '/' + path.package + '/summary.html';
        ajax(url, function(data){
            var pg = new Page(path, 'package');
            pg.body = data;
            cont(pg);
        });
    }
}

function Group(parent, node) {
    if(typeof parent !== 'undefined' && typeof node !== 'undefined'){
        this.typ = null;
        if(parent !== null) {
            this.depth = parent.depth + 1;
            this.icount = parent.icount;
            this.auto_expand = parent.auto_expand;
            this.filters = parent.filters;
            this.current = parent.current;
            this.decorate = parent.decorate_children;
            this.decorate_children = parent.decorate_children;
        } else {
            this.depth = 0;
            this.icount = 6;
            this.auto_expand = true;
            this.filters = [];
            this.current = null;
            this.decorate = true;
            this.decorate_children = true;
        }
        this.expanded = this.auto_expand;
        this.loading = false;
        if(node !== null) {
            this.node = node;
            this.content = null;
            var pathAttr = this.node.attr('path');
            if(typeof pathAttr !== 'undefined') {
                this.path = new Path(pathAttr);
            } else {
                this.path = null;
            }
            this.handle = this.node.children();
        } else {
            this.node = null;
            this.content = null;
            this.path = null;
            this.handle = null;
        }
    }
}

Group.prototype.load_content = function(data){
    this.update_links(data);
    this.load_children(data);
    this.content = data;
}

Group.prototype.add_filter = function(from, to){
    this.filters = this.filters.slice(0);
    this.filters[this.filters.length] = { from: from, to: to };
}

Group.prototype.show_unexpanded = function(){ }

Group.prototype.show_expanded = function(){ }

Group.prototype.show_disabled = function(){ }

Group.prototype.expand = function(expand){
    if(typeof expand === 'undefined') {
        expand = ! this.expanded;
    }
    if(expand) {
        if(this.content === null) {
            if(! this.loading) {
                this.loading = true;
                var self = this;
                var load = function(page){
                    if(page.alias !== null) {
                        self.add_filter(page.alias, self.current);
                    } else {
                        self.add_filter(page.path, self.current);
                    }
                    self.load_content(page.body);
                    self.show_expanded(true);
                };
                load_path(this.path, load);
            }
        } else {
            this.show_expanded(true);
        }
    } else {
        this.show_unexpanded(true);
    }
}

Group.prototype.show = function(){
    if(this.content === null && this.path === null) {
        this.show_disabled();
    } else {
        if(this.auto_expand) {
            if(this.content === null) {
                this.loading = true;
                this.show_unexpanded(false);
                var self = this;
                var load = function(page){
                    if(page.alias !== null) {
                        self.add_filter(page.alias, self.current);
                    } else {
                        self.add_filter(page.path, self.current);
                    }
                    self.load_content(page.body);
                    self.show_expanded(false);
                    show_type(self.typ)
                };
                load_path(this.path, load);
            } else {
                this.show_expanded(false);
            }
        } else {
            this.show_unexpanded(false);
        }
    }
}

Group.prototype.update_links = function(data) {
    var links = $('a.ocaml_internal', data);
    var filters = this.filters;
    links.each(function(){
        var url = $(this).attr('href');
        var path = new Path(url);
        var changed = false;
        for(var i = 0; i < filters.length; i++) {
            if(path.substitute(filters[i].from, filters[i].to)) {
                changed = true;
                break;
            }
        }
        if(changed) {
            $(this).attr('href', path.url())
        }
    });
}

function IncludeGroup(parent, node, label, idx) {
    Group.call(this, parent, node);
    this.icount = (parent.icount + idx + 2) % 7;
    if(this.icount === parent.icount) {
        this.icount = (this.icount + 4) % 7;
    }
    if(this.depth > 4) {
        this.auto_expand = false;
    }
    this.typ = parent.typ;
    var typesAttr = JSON.parse(this.node.attr('types'));
    if (typesAttr.indexOf(this.typ) !== -1){
        this.auto_expand = true;
    }
    this.button = null;
    this.block = null;
    this.inner_block = null;
    this.summary = null;
    this.content_added = false;
    var indent = 250 - (10 * this.depth);
    var indent = 0; /* TODO anil */
    this.pindent = '+=' + indent.toString() + 'px';
    this.nindent = '-=' + indent.toString() + 'px';
    var exdent = 40 - (2 * this.depth);
    this.pexdent = '+=' + exdent.toString() + 'px';
    this.nexdent = '-=' + exdent.toString() + 'px';
}

IncludeGroup.prototype = new Group();

IncludeGroup.prototype.prepare = function(){
    if(this.decorate) {
        if(this.button === null) {
            this.button = $('<div>').addClass('ocaml_expander_plus');
            var self = this;
            this.button.click(function () { self.expand() });
        }
        if(this.block === null) {
            this.summary = this.handle.filter('div.ocaml_summary');
            this.handle = $('<div>')
                             .append(this.button)
                             .append(this.handle);
            this.inner_block = $('<div>')
                             .addClass('ocaml_expanded_include_' + this.icount)
                             .css('display', 'inline-block')
                             .css('padding-top', '3px')
                             .css('padding-right', '3px')
                             .css('padding-bottom', '3px')
                             .append(this.handle);
            this.block = $('<div>').append(this.inner_block);
            this.node.append(this.block);
        }
        if(!this.content_added && this.content !== null) {
            this.inner_block.append(this.content);
            this.content_added = true;
        }
    }
}

IncludeGroup.prototype.show_unexpanded = function(animate){
    this.prepare();
    if(this.button !== null) {
        this.button.removeClass('ocaml_expander_minus');
        this.button.addClass('ocaml_expander_plus');
    }
    if(animate) {
        if(this.content !== null) {
            this.content.hide({duration: 'fast', queue: false});
            if(this.decorate) {
                this.summary.show({duration: 'fast', queue: false});
                this.block.animate({marginLeft: '0', marginRight: '0'}, {duration: 'fast', queue: false});
                this.inner_block.animate({minWidth: '0'}, {duration: 'fast', queue: false});
                this.content.animate({marginLeft: '0', marginRight: '0'}, {duration: 'fast', queue: false});
                //this.handle.animate({fontSize : '13px'}, {duration: 'fast', queue: false});
            }
        }
    } else {
        if(this.content !== null) {
            this.content.hide();
            if(this.decorate) {
                this.summary.show();
                this.block.css('margin-left', '');
                this.block.css('margin-right', '');
                this.inner_block.css('min-width', '');
                this.content.css('margin-left', '');
                this.content.css('margin-right', '');
                //this.handle.css('font-size', '13px');
            }
        }
    }
    this.expanded = false;
}

IncludeGroup.prototype.show_expanded = function(animate){
    this.prepare();
    if(this.button !== null) {
        this.button.removeClass('ocaml_expander_plus');
        this.button.addClass('ocaml_expander_minus');
    }
    if(animate) {
        if(this.content !== null) {
            this.content.show({duration: 'fast', queue: false});
            this.summary.hide({duration: 'fast', queue: false});
            this.block.animate({marginLeft: this.nindent, marginRight: this.nexdent}, {duration: 'fast', queue: false});
            this.inner_block.animate({minWidth: '100%'}, {duration: 'fast', queue: false});
            this.content.animate({marginLeft: this.pindent, marginRight: this.pexdent}, {duration: 'fast', queue: false});
            //this.handle.animate({fontSize : '11px'}, {duration: 'fast', queue: false});
        }
    } else {
        if(this.content !== null) {
            this.content.show();
            this.summary.hide();
            this.block.css('margin-left', this.nindent);
            this.block.css('margin-right', this.nexdent);
            this.block.css('margin-top', '1rem');
            this.inner_block.css('min-width', '100%');
            this.content.css('margin-left', this.pindent);
            this.content.css('margin-right', this.pexdent);
            //this.handle.css('font-size', '11px');
        }
    }
    this.expanded = true;
}

IncludeGroup.prototype.show_disabled = function(){
    if(this.button !== null) {
        this.button.removeClass('ocaml_expander_plus');
        this.button.removeClass('ocaml_expander_minus');
        this.button.addClass('ocaml_expander_disabled');
        this.button.off('click');
    }
    if(this.content !== null) {
        this.content.hide();
    }
    this.expanded = false;
}

function SigGroup(parent, node, label, idx) {
    Group.call(this, parent, node);
    this.icount = (parent.icount - idx - 1) % 7;
    this.auto_expand = false;
    this.decorate_children = false;
    var nameAttr = this.node.attr('name');
    this.current = this.current.copy();
    this.current.extend(nameAttr, label);
    this.button = null;
    this.block = null;
    this.content_added = false;
}

SigGroup.prototype = new Group();

SigGroup.prototype.prepare = function(){
    if(this.decorate && this.button === null) {
        this.button = $('<div>').addClass('ocaml_expander_plus');
        var self = this;
        this.button.click(function () { self.expand() });
    }
    if(this.block === null) {
        this.block = $('<div>')
                         .addClass('expanding_sig')
                         .append(this.button)
                         .append(this.handle);
        this.node.append(this.block);
    }
    if(!this.content_added && this.content !== null) {
        this.content.css('margin-left', '2em');
        this.content.css('padding-left', '2em');
        this.content.css('border-left', '3px solid lightgrey');
        this.block.append(this.content);
        this.content_added = true;
    }
}

SigGroup.prototype.show_unexpanded = function(animate){
    this.prepare();
    if(this.button !== null) {
        this.button.removeClass('ocaml_expander_minus');
        this.button.addClass('ocaml_expander_plus');
    }
    if(animate) {
        if(this.content !== null) {
            this.content.hide('fast');
        }
    } else {
        if(this.content !== null) {
            this.content.hide();
        }
    }
    this.expanded = false;
}

SigGroup.prototype.show_expanded = function(animate){
    this.prepare();
    if(this.button !== null) {
        this.button.removeClass('ocaml_expander_plus');
        this.button.addClass('ocaml_expander_minus');
    }
    if(animate) {
        if(this.content !== null) {
            this.content.show('fast');
        }
    } else {
        if(this.content !== null) {
            this.content.show();
        }
    }
    this.expanded = true;
}

SigGroup.prototype.show_disabled = function(){
    this.prepare();
    if(this.button !== null) {
        this.button.removeClass('ocaml_expander_plus');
        this.button.removeClass('ocaml_expander_minus');
        this.button.addClass('ocaml_expander_disabled');
        this.button.off('click');
    }
    if(this.content !== null) {
        this.content.hide();
    }
    this.expanded = false;
}

Group.prototype.load_children = function(data, Kind, label){
    if(typeof Kind === 'undefined') {
        this.load_children(data, IncludeGroup, 'include');
        this.load_children(data, SigGroup, 'module');
        this.load_children(data, SigGroup, 'modtype');
        this.load_children(data, SigGroup, 'class');
    } else {
        var children = $('> div.ocaml_' + label, data);
        var self = this;
        children.each(function(idx) {
            var grp = new Kind(self, $(this), label, idx);
            var content = $('> div.ocaml_content', $(this));
            if(content.length > 0) {
                grp.load_content(content);
            }
            grp.show();
        });
    }
}

$(document).ready(function () {
    var url = ocaml_base + '/' + ocaml_package + '/' + location.hash;
    var p = new Path(url);
    var grp = new Group(null, null);
    load_path(p, function(page){
        grp.typ = page.typ;
        grp.current = page.path;
        if(page.alias !== null) {
          grp.add_filter(page.alias, page.path);
        }
        grp.load_content(page.body);
        display_page(page);
        show_type(page.typ);
    });
});

$(window).on('hashchange', function () {
    var url = ocaml_base + '/' + ocaml_package + '/' + location.hash;
    var p = new Path(url);
    var grp = new Group(null, null);
    load_path(p, function(page){
        grp.typ = page.typ;
        grp.current = page.path;
        if(page.alias !== null) {
          grp.add_filter(page.alias, page.path);
        }
        grp.load_content(page.body);
        display_page(page);
        scrollTo(0,0);
        show_type(page.typ);
    });
});
