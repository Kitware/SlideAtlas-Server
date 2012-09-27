from flask import Blueprint, request, render_template, session, redirect, flash, url_for

#from mongokit import Connection

mod = Blueprint('sessions', __name__)

@mod.route('/sessions')
def sessions():
    """
    - /sessions  With no argument displays list of sessions accessible to current user
    - /sessions?sess=10239094124  searches for the session id
    """

    if 'user' in session:
        name = session['user']['label']
    else:
        # Send the user back to login page
        # with some message
        flash("You must be logged in to see that resource", "error")
        return redirect(url_for('login.login'))

    # See if the user is requesting any session id
    sessid = request.args.get('sessid', None)

    if sessid:
        # Find and return a single session
        asession = {
                    'sessid' : 1234,
                    'label' : 'Sessions1 label'
                    }

        return render_template('session.html', session=asession, name=name)

    else:
        # Find and return a list of session names / ids
        sessionlist = []

        sessionlist.append({'rule':'Rule1 label',
            'sessions' :[
                                { 'sessid' : 1234,
                                  'label' : 'Sessions1 label',
                                  'images' : False },

                                { 'sessid' : 1234,
                                  'label' : 'Sessions2 label',
                                  'canadmin' : True},
                                  ]
            })
        # Array of dictionaries

        sessionlist.append({'rule':'Rule2 label',
            'sessions' :[
                                { 'sessid' : 1234,
                                  'label' : 'Rule2 Sessions1 label',
                                  'images' : True },

                                { 'sessid' : 1234,
                                  'label' : 'Rule 2 Sessions2 label',
                                  'canadmin' : False},
                                  ]
            })

        return render_template('sessionlist.html', sessions=sessionlist, name=name)
