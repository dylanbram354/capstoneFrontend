import React, { useState, useEffect} from 'react';
import useForm from '../hooks/useForm';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Form, Button, Table } from 'react-bootstrap';
import EditLessonForm from './editLessonForm';
import useCal from '../hooks/useCal';

export default function LandingPage(props){

    const [user, setUser] = useState(null);
    const [myLessons, setMyLessons] = useState(null);
    const {addEvent, deleteEvent} = useCal();

    useEffect(() => {
        setUser(props.user);
        if (props.user != null){
            getMyLessons();
        }
    }, [props.user]);

    async function getMyLessons(){
        try{
            let response = await axios.get('https://localhost:44394/api/lessons/all', { headers: {Authorization: "Bearer " + props.user.token}});
            let lessons = response.data;
            lessons.sort(function(a,b){return a.startTime.localeCompare(b.startTime)});
            setMyLessons(lessons);
        }
        catch(err){
            alert(err)
        }
    }


    async function cancelLesson(lesson){
        if (window.confirm("Are you sure? This will delete your record of this lesson along with any associated Google Calendar events.")){
            try{
                if(lesson.googleEventId != null){
                    await deleteEvent(lesson.googleEventId);
                }
                let response = await axios.delete(`https://localhost:44394/api/lessons/delete/${lesson.lessonId}`, { headers: {Authorization: "Bearer " + props.user.token}});
                console.log(response.data);
                getMyLessons();
            }
            catch(err){
                alert(err)
            }
        }
    }

    function sortLessonsByDate(lessons){
        let upcoming = [];
        let today = []
        let past = [];
        let now = new Date();
        lessons.map(lesson => {
            let date = new Date(lesson.startTime);
            if (date.setHours(0,0,0,0) == now.setHours(0,0,0,0)){
                today.push(lesson);
            }
            else if (date.setHours(0,0,0,0) > now.setHours(0,0,0,0)){
                upcoming.push(lesson);
            }
            else{
                past.push(lesson);
            }
        })
        today.sort(function(a,b){return a.startTime.localeCompare(b.startTime)});
        past.sort(function(a,b){return a.startTime.localeCompare(b.startTime)});
        upcoming.sort(function(a,b){return a.startTime.localeCompare(b.startTime)});
        return { past: past, today: today, upcoming: upcoming}
    }

    function getTimeFromDateObject(d){
        let h = d.getHours();
        let m = d.getMinutes();
        if (m == 0){
            m ='00'
        }
        else if (0 < m && m < 10){
            m = '0'+`${m}`;
        }
        let amPm = 'AM';
        if (h > 12){
            h = h - 12;
            amPm = 'PM';
        }
        return (`${h}:${m} ${amPm}`)
    }

    function getDateFromDateObject(d){
        let day = d.getDate();
        let year = d.getFullYear();
        let month = d.getMonth()+1;
        return (`${month}/${day}/${year}`)
    }

    function generateStudentLessonTable(){
        let sortedLessons = sortLessonsByDate(myLessons);
        let todayData = sortedLessons.today.map(lesson => {
            return(
                <tr>
                    <td>{lesson.relationship.teacher.firstName} {lesson.relationship.teacher.lastName}</td>
                    <td>{getTimeFromDateObject(new Date(lesson.startTime))}</td>
                    <td>{getTimeFromDateObject(new Date(lesson.endTime))}</td>
                    <td>${lesson.feeAmount}</td>
                    {lesson.location ? <td>{lesson.location}</td> : <td>No data</td>}
                </tr>
            )
        });

        let upcomingData = sortedLessons.upcoming.map(lesson => {
            return(
                <tr>
                    <td>{lesson.relationship.teacher.firstName} {lesson.relationship.teacher.lastName}</td>
                    <td>{getDateFromDateObject(new Date(lesson.startTime))}</td>
                    <td>{getTimeFromDateObject(new Date(lesson.startTime))}</td>
                    <td>{getTimeFromDateObject(new Date(lesson.endTime))}</td>
                    <td>${lesson.feeAmount}</td>
                    {lesson.location ? <td>{lesson.location}</td> : <td>No data</td>}
                </tr>
            )
        })

        return(
            <React.Fragment>
                {todayData.length > 0 && 
                    <div className='mb-4'>
                        <h2>You have a lesson today!</h2>
                        <Table>
                            <thead>
                                <tr>
                                    <th>Teacher</th>
                                    <th>Start time</th>
                                    <th>End time</th>
                                    <th>Fee amount</th>
                                    <th>Location</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todayData}
                            </tbody>
                        </Table>
                    </div>
                }
                <div>
                    <h2>Upcoming Lessons</h2>
                    <Table>
                        <thead>
                            <tr>
                                <th>Teacher</th>
                                <th>Date</th>
                                <th>Start time</th>
                                <th>End time</th>
                                <th>Fee amount</th>
                                <th>Location</th>
                            </tr>
                        </thead>
                        <tbody>
                            {upcomingData}
                        </tbody>
                    </Table>
                </div>
            </React.Fragment>
        )
    }

    function generateTeacherLessonTable(){
        let sortedLessons = sortLessonsByDate(myLessons);
        let todayData = sortedLessons.today.map(lesson => {
            return(
                <tr>
                    <td>{lesson.relationship.student.firstName} {lesson.relationship.student.lastName}</td>
                    <td>{getTimeFromDateObject(new Date(lesson.startTime))}</td>
                    <td>{getTimeFromDateObject(new Date(lesson.endTime))}</td>
                    <td>{lesson.googleEventId ? 'Yes' : 'No' }</td>
                    <td>${lesson.feeAmount}</td>
                    <td>
                        <Button as={Link} to={{pathname: '/editLesson', state: { lesson: lesson }}}>Log Lesson</Button>
                    </td>
                    <td>
                        <Button variant='warning' onClick={() => cancelLesson(lesson)}>Cancel Lesson</Button>
                    </td>
                </tr>
            )
        });
        let upcomingData = sortedLessons.upcoming.map(lesson => {
            return(
                <tr>
                    <td>{lesson.relationship.student.firstName} {lesson.relationship.student.lastName}</td>
                    <td>{getDateFromDateObject(new Date(lesson.startTime))}</td>
                    <td>{getTimeFromDateObject(new Date(lesson.startTime))}</td>
                    <td>{getTimeFromDateObject(new Date(lesson.endTime))}</td>
                    <td>{lesson.googleEventId ? 'Yes' : 'No' }</td>
                    <td>${lesson.feeAmount}</td>
                    <td>
                        <Button variant='warning' onClick={() => cancelLesson(lesson)}>Cancel Lesson</Button>
                    </td>
                </tr>
            )
        })

        return(
            <React.Fragment>
                <div className='mb-4'>
                    <h2>Today's Lessons</h2>
                    <Table>
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Start time</th>
                                <th>End time</th>
                                <th>Google Event</th>
                                <th>Fee amount</th>
                                <th></th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {todayData}
                        </tbody>
                    </Table>
                </div>
                <div>
                    <h2>Upcoming Lessons</h2>
                    <Table>
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Date</th>
                                <th>Start time</th>
                                <th>End time</th>
                                <th>Google Event</th>
                                <th>Fee amount</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {upcomingData}
                        </tbody>
                    </Table>
                </div>
            </React.Fragment>
        )
    }

    return(
        <div className='row'>
            <div className='col-2' />
            <div className='col-12 col-sm-8'>
            {user ?
                <React.Fragment>
                    {user.role === "Teacher" ?
                        <React.Fragment>
                        <div className='text-center'>
                            {myLessons ? 
                                <React.Fragment>
                                {myLessons.length > 0 ?
                                    generateTeacherLessonTable()
                                :
                                    <p>No lessons to display.</p>
                                }
                                </React.Fragment>
                            :
                            <React.Fragment>
                                <p>Loading...</p>
                            </React.Fragment>
                        }
                        </div>
                        </React.Fragment>
                    :
                        <React.Fragment>
                        <div className='text-center'>
                            {myLessons ? 
                                <React.Fragment>
                                {myLessons.length > 0 ?
                                    generateStudentLessonTable()
                                :
                                    <p>No lessons to display.</p>
                                }
                                </React.Fragment>
                            :
                            <React.Fragment>
                                <p>Loading...</p>
                            </React.Fragment>
                        }
                        </div>
                        </React.Fragment>
                    } 
                </React.Fragment>
                :
                <div className='text-center'>
                    <p>Logged out</p>
                </div>
            }
            </div>
            <div className='col-2' />
        </div>
    )
}