import React from 'react';
import { ajax } from 'rxjs/ajax';
import { map } from 'rxjs/operators';
import { useEpic } from 'use-epic';

const peopleEpic = () =>
  ajax
    .getJSON(
      `https://randomuser.me/api/?results=15&nat=us&seed=use-epic-simple-ajax`
    )
    .pipe(map(({ results }) => results));

export const PeopleList = () => {
  const [people] = useEpic(peopleEpic);

  return (
    <ul className='list'>
      {people &&
        people.map(person => {
          return (
            <li key={person.login.uuid}>
              <Person {...person} />
            </li>
          );
        })}
    </ul>
  );
};

const Person = ({
  name,
  picture: { large },
  email,
  location,
  dob: { age },
  gender,
}) => (
  <div className='person'>
    <figure className='img'>
      <img src={large} alt='' />
    </figure>
    <div className='info'>
      <h3 className='name'>
        {name.first} {name.last}
      </h3>
      <ul>
        <li>{email}</li>
        <li className='location'>
          {location.city}, {location.state}
        </li>
        <li className='location'>
          {age}, {gender}
        </li>
      </ul>
    </div>
  </div>
);
