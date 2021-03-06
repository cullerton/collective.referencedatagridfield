function prepareRefPopup(context) {
    jq(function () {
        // the overlay itself
        jq('.addreferencedatagrid', context).overlay({
            closeOnClick: false,
            onBeforeLoad: function () {
                ov = jq('div#content').data('overlay');
                // close overlay, if there is one already
                // we only allow one referencebrowser per time
                if (ov) {
                    ov.close();
                }
                var wrap = this.getOverlay().find('.overlaycontent');
                var src = this.getTrigger().attr('src');
                var srcfilter = src + ' >*';
                wrap.data('srcfilter', srcfilter);
                jq('div#content').data('overlay', this);
                resetHistory();
                wrap.load(srcfilter);
            },
            onLoad: function () {
                widget_id = this.getTrigger().attr('rel').substring(6);
                disablecurrentrelations(widget_id);
            }
        });

        // the breadcrumb-links and the links of the 'tree'-navigation
        jq('[id^=atdgrb_] a.browsesite', context).live('click', function (event) {
            var target = jq(this);
            var src = target.attr('href');
            var wrap = target.parents('.overlaycontent');
            var srcfilter = src + ' >*';
            pushToHistory(wrap.data('srcfilter'));
            wrap.data('srcfilter', srcfilter);
            // the history we are constructing here is destinct from the
            // srcfilter-history. here we construct a selection-widget, which
            // is available, if the history_length-parameter is set on the widget
            // the srcfilter-history is used for storing the URLs to make the
            // 'Back'-link work.
            var newoption = '<option value="' + src + '">' + target.attr('rel') + '</option>';
            refreshOverlay(wrap, srcfilter, newoption);
            return false;
        });

        // the links for inserting referencens
        jq('[id^=atdgrb_] input.insertreferencedatagrid', context).live('click', function (event) {
            var target = jq(this);
            var wrap = target.parents('.overlaycontent');
            var fieldname = wrap.find('input[name=fieldName]').attr('value');
            var fieldtitle = wrap.find('input[name=fieldTitleName]').attr('value');
            var fieldlink = wrap.find('input[name=fieldLinkName]').attr('value');
            var multi = wrap.find('input[name=multiValued]').attr('value');
            var close_window = wrap.find('input[name=close_window]').attr('value');
            //var title = target.parents('tr').find('img').attr('alt');
            var title = target.parent().next('td').find('strong').html();
            var linkpath = target.next('input').attr('rel');
            var active_tr = wrap.parents('tr[id=datagridwidget-row]');
            var uid = target.attr('rel');
            refdatagridbrowser_setReference(fieldname, uid, title, parseInt(multi), active_tr, fieldtitle, title, fieldlink, linkpath);
            if (close_window === '1') {
                overlay = jq('div#content').data('overlay');
                overlay.close();
            } else {
                showMessageRDG(title);
            };
            jq(this).attr('disabled', 'disabled');
        });

        // the history menu
        jq('[id^=atdgrb_] form#history select[name=path]', context).live('change', function (event) {
            var target = jq(this);
            var wrap = target.parents('.overlaycontent');
            src = jq('[id^=atdgrb_] form#history select[name=path] :selected', this).attr('value');
            var srcfilter = src + ' >*';
            refreshOverlay(wrap, srcfilter, '');
            return false;
        });

        // the pagination links
        jq('[id^=atdgrb_] div.listingBar a').live('click', function (event) {
            var target = jq(this);
            var src = target.attr('href');
            var wrap = target.parents('.overlaycontent');
            var srcfilter = src + ' >*';
            refreshOverlay(wrap, srcfilter, '');
            return false;
        });

        // the search form
        jq('[id^=atdgrb_] form#search input[name=submit]', context).live('click', function (event) {
            var target = jq(this);
            var src = target.parents('form').attr('action');
            var wrap = target.parents('.overlaycontent');
            var fieldname = wrap.find('input[name=fieldName]').attr('value');
            var fieldtitle = wrap.find('input[name=fieldTitleName]').attr('value');
            var fieldlink = wrap.find('input[name=fieldLinkName]').attr('value');
            var fieldrealname = wrap.find('input[name=fieldRealName]').attr('value');
            var at_url = wrap.find('input[name=at_url]').attr('value');
            var searchvalue = wrap.find('input[name=searchValue]').attr('value');
            var multi = wrap.find('input[name=multiValued]').attr('value');
            var close_window = wrap.find('input[name=close_window]').attr('value');
            qs = 'searchValue=' + searchvalue + '&fieldRealName=' + fieldrealname + '&fieldName=' + fieldname + '&multiValued=' + multi + '&close_window=' + close_window + '&at_url=' + at_url + '&fieldTitleName=' + fieldtitle + '&fieldLinkName=' + fieldlink;
            var srcfilter = src + '?' + qs + ' >*';
            pushToHistory(wrap.data('srcfilter'));
            wrap.data('srcfilter', srcfilter);
            refreshOverlay(wrap, srcfilter, '');
            return false;
        });
    });
};

jq(document).ready(function () {
    prepareRefPopup(this);
});
jq.fn.prepRefPopup = function () {
    prepareRefPopup(this);
};

function disablecurrentrelations(widget_id) {
    jq('ul#' + widget_id + ' :input').each(

    function (intIndex) {
        uid = jq(this).attr('value');
        cb = jq('input[rel=' + uid + ']');
        cb.attr('disabled', 'disabled');
        cb.attr('checked', 'checked');
    });
}

// function to return a reference from the popup window back into the widget
function refdatagridbrowser_setReference(widget_id, uid, label, multi, active_tr, widget_title_id, link_title, widget_link_id, link_path) {
    var element = null,
        label_element = null,
        current_values = null,
        i = null,
        list = null,
        li = null,
        input = null,
        up_element = null,
        down_element = null,
        container = null;

    if (typeof(active_tr) != "undefined" && typeof(link_title) != "undefined" && typeof(link_path) != "undefined" && typeof(widget_title_id) != "undefined" && typeof(widget_link_id) != "undefined") {
        // Update Uid field
        jq('#' + widget_id, active_tr).attr("value", uid);
        // Update title field
        title = jq('#' + widget_title_id, active_tr);
        title.attr("value", link_title);
        title.addClass("not-changed-title-field");
        title.attr("default_value", link_title);
        title.blur(triggerTitleClass);
        title.focus(triggerOnFocusStyles);
        // Update link field
        link = jq('#' + widget_link_id, active_tr);
        link.attr('readonly', false);
        link.attr('value', link_path);
        link.attr('readonly', true);
        link.addClass("hidden-field");

    } else if (multi === 0) {
        // differentiate between the single and mulitselect widget
        // since the single widget has an extra label field.
        jq('#' + widget_id).attr('value', uid);
        jq('#' + widget_id + '_label').attr('value', label);
    } else {
        // check if the item isn't already in the list
        current_values = jq('#' + widget_id + ' input');
        for (i = 0; i < current_values.length; i++) {
            if (current_values[i].value === uid) {
                return false;
            }
        }
        // now add the new item
        list = document.getElementById(widget_id);
        // add ul-element to DOM, if it is not there
        if (list === null) {
            container = jq('#archetypes-fieldname-' + widget_id + ' input + div');
            if (!container.length) {
                // fix for Plone 3.3 collections, with a weird widget-id
                container = jq('#archetypes-fieldname-value input + div');
            }
            container.after('<ul class="visualNoMarker" id="' + widget_id + '"></ul>');
            list = document.getElementById(widget_id);
        }
        li = document.createElement('li');
        label_element = document.createElement('label');
        input = document.createElement('input');
        input.type = 'checkbox';
        input.value = uid;
        input.checked = true;
        input.name = widget_id + ':list';
        label_element.appendChild(input);
        label_element.appendChild(document.createTextNode(' ' + label));
        li.appendChild(label_element);
        li.id = 'ref-' + widget_id + '-' + current_values.length;

        sortable = jq('input[name=' + widget_id + '-sortable]').attr('value');
        if (sortable === '1') {
            up_element = document.createElement('a');
            up_element.title = 'Move Up';
            up_element.innerHTML = '&#x25b2;';
            up_element.onclick = function () {
                refdatagridbrowser_moveReferenceUp(this);
                return false;
            };

            li.appendChild(up_element);

            down_element = document.createElement('a');
            down_element.title = 'Move Down';
            down_element.innerHTML = '&#x25bc;';
            down_element.onclick = function () {
                refdatagridbrowser_moveReferenceDown(this);
                return false;
            };

            li.appendChild(down_element);
        }
        list.appendChild(li);
        console.log(list);
        console.log(li);

        // fix on IE7 - check *after* adding to DOM
        input.checked = true;
    }
}

// function to clear the reference field or remove items
// from the multivalued reference list.
function refdatagridbrowser_removeReference(widget_id, multi) {
    var x = null,
        element = null,
        label_element = null,
        list = null;

    if (multi) {
        list = document.getElementById(widget_id);
        for (x = list.length - 1; x >= 0; x--) {
            if (list[x].selected) {
                list[x] = null;
            }
        }
        for (x = 0; x < list.length; x++) {
            list[x].selected = 'selected';
        }
    } else {
        jq('#' + widget_id).attr('value', "");
        jq('#' + widget_id + '_label').attr('value', "");
    }
}

function refdatagridbrowser_moveReferenceUp(self) {
    var elem = self.parentNode,
        eid = null,
        pos = null,
        widget_id = null,
        newelem = null,
        prevelem = null,
        arrows = null,
        cbs = null;
    if (elem === null) {
        return false;
    }
    eid = elem.id.split('-');
    pos = eid.pop();
    if (pos === 0) {
        return false;
    }
    widget_id = eid.pop();
    newelem = elem.cloneNode(true);

    //Fix: (IE keep the standard value)
    cbs = newelem.getElementsByTagName("input");
    if (cbs.length > 0) {
        cbs[0].checked = elem.getElementsByTagName("input")[0].checked;
    }

    prevelem = document.getElementById('ref-' + widget_id + '-' + (pos - 1));

    // up arrow
    arrows = newelem.getElementsByTagName("a");
    arrows[0].onclick = function () {
        refdatagridbrowser_moveReferenceUp(this);
    };
    // down arrow
    arrows[1].onclick = function () {
        refdatagridbrowser_moveReferenceDown(this);
    };

    elem.parentNode.insertBefore(newelem, prevelem);
    elem.parentNode.removeChild(elem);
    newelem.id = 'ref-' + widget_id + '-' + (pos - 1);
    prevelem.id = 'ref-' + widget_id + '-' + pos;
}

function refdatagridbrowser_moveReferenceDown(self) {
    var elem = self.parentNode,
        eid = null,
        pos = null,
        widget_id = null,
        current_values = null,
        newelem = null,
        nextelem = null,
        cbs = null,
        arrows = null;
    if (elem === null) {
        return false;
    }
    eid = elem.id.split('-');
    pos = parseInt(eid.pop(), 10);
    widget_id = eid.pop();
    current_values = jq('#' + widget_id + ' input');
    if ((pos + 1) === current_values.length) {
        return false;
    }

    newelem = elem.cloneNode(true);
    //Fix: (IE keep the standard value)
    cbs = newelem.getElementsByTagName("input");
    if (cbs.length > 0) {
        cbs[0].checked = elem.getElementsByTagName("input")[0].checked;
    }

    // up img
    arrows = newelem.getElementsByTagName("a");
    arrows[0].onclick = function () {
        refdatagridbrowser_moveReferenceUp(this);
    };
    // down img
    arrows[1].onclick = function () {
        refdatagridbrowser_moveReferenceDown(this);
    };

    nextelem = document.getElementById('ref-' + widget_id + '-' + (pos + 1));

    elem.parentNode.insertBefore(newelem, nextelem.nextSibling);
    elem.parentNode.removeChild(elem);
    newelem.id = 'ref-' + widget_id + '-' + (pos + 1);
    nextelem.id = 'ref-' + widget_id + '-' + pos;
}

function showMessageRDG(message) {
    jq('#messageTitle').text(message);
    jq('#message').show();
}

function submitHistoryForm() {
    var form = document.history;
    var path = form.path.options[form.path.selectedIndex].value;
    form.action = path;
    form.submit();
}

function pushToHistory(url) {
    var history = jq(document).data('atdgrb_history');
    history.push(url);
    jq(document).data('atdgrb_history', history);
}

function resetHistory() {
    jq(document).data('atdgrb_history', []);
}

function popFromHistory() {
    var history = jq(document).data('atdgrb_history');
    value = history.pop();
    jq(document).data('atdgrb_history', history);
    return value;
}

function refreshOverlay(wrap, srcfilter, newoption) {
    var oldhistory = jq('[id^=atdgrb_] form#history select');
    wrap.load(srcfilter, function () {
        jq('[id^=atdgrb_] form#history select').append(newoption + oldhistory.html());
        ov = jq('div#content').data('overlay');
        widget_id = ov.getTrigger().attr('rel').substring(6);
        disablecurrentrelations(widget_id);
    });
}


// ReferenceDataGridField related functions
dataGridFieldFunctions.addReferenceDataGridRow = function (id) {
    /* Explitcly add row for given DataGridField,
           then update row content with reference popup
           functionality.

           @param id Archetypes field id for the widget

    */

    // Add row with own DataGridField method
    this.addRow(id);

    // Find active row and add overlay related processors for active row
    var active_row = jq("#datagridwidget-tbody-" + id + " tr#datagridwidget-row:last");
    jq(active_row).prepRefPopup();
}

dataGridFieldFunctions.addReferenceDataGridRowAfter = function (currnode) {
    /*
        Creates a new row before the clicked row with preparation of
        reference related overlay.
    */

    // add row with datagrid original method
    this.addRowAfter(currnode);
    // find active row
    var tbody = jq(currnode).parents("[id^=datagridwidget-tbody-]");
    var rows = jq("#datagridwidget-row", tbody);
    var curr_row = jq(currnode).parents("tr#datagridwidget-row");
    var active_row = rows[rows.index(curr_row) - 1];
    // add overlay related processors for active row
    jq(active_row).prepRefPopup();
}

dataGridFieldFunctions.OriginalUpdateOrderIndex = dataGridFieldFunctions.updateOrderIndex;
dataGridFieldFunctions.updateOrderIndex = function (tbody) {
    var rows, tr, idx, ov, ov_id, under_idx, new_ov_id
    // update order index with original method
    this.OriginalUpdateOrderIndex(tbody);
    // Update overlay related attributes after rows index updating
    // for all datagridwidget rows
    rows = jq("#datagridwidget-row", tbody);
    for (var i = 0; i < rows.length; ++i) {
        // get working row
        tr = rows[i];
        // Update overlay related tags attributes
        order_tag = jq("input[id^=orderindex__]", tr);
        idx = order_tag.attr("value");
        // Update rel attribute for overlay box
        ov = jq("input.addreferencedatagrid", tr);
        ov_id = ov.attr("rel");
        under_idx = ov_id.lastIndexOf("_");
        base_id = (under_idx >= 0) ? ov_id.substring(0, under_idx) : "#atrb";
        new_ov_id = base_id + "_" + idx;
        ov.attr("rel", new_ov_id);
        // Update target box id - it must be equal to rel attribute
        jq("div[id^=atdgrb_]", tr).attr("id", new_ov_id.substring(1));
    }

}

// Event handlers, used in referencebrowser.js
function triggerTitleClass(e) {
    var element = jq(e.target);
    var current = element.attr("value");
    var initial = element.attr("default_value");
    if (initial == null || current == null) return;

    if (initial == current) {
        element.attr("class", "not-changed-title-field");
    } else {
        element.attr("class", "changed-title-field")
    }
}

function triggerOnFocusStyles(e) {
    jq(e.target).attr("class", "changed-title-field")
}
