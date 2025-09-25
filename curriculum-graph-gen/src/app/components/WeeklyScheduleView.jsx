'use client';

import React from 'react';

const WeeklyScheduleView = ({ classes }) => {
  // Horários de aula padrão
  const timeSlots = [
    '07:30 - 08:20', '08:20 - 09:10', '09:10 - 10:00', '10:00 - 10:50', '10:50 - 11:40',
    '13:30 - 14:20', '14:20 - 15:10', '15:10 - 16:00', '16:00 - 16:50', '16:50 - 17:40',
    '18:30 - 19:20', '19:20 - 20:10', '20:10 - 21:00', '21:00 - 21:50'
  ];

  const days = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

  // Cores para as diferentes disciplinas
  const colors = [
    'bg-blue-800 border-blue-700',
    'bg-green-800 border-green-700',
    'bg-purple-800 border-purple-700',
    'bg-red-800 border-red-700',
    'bg-yellow-800 border-yellow-700',
    'bg-pink-800 border-pink-700',
    'bg-indigo-800 border-indigo-700',
    'bg-cyan-800 border-cyan-700'
  ];

  // Atribuir uma cor para cada disciplina
  const courseColors = {};
  classes.forEach((cls, index) => {
    courseColors[cls.courseId] = colors[index % colors.length];
  });

  // Construir matriz do horário
  const scheduleMatrix = Array(timeSlots.length).fill().map(() => Array(days.length).fill(null));

  // Preencher a matriz com as aulas
  classes.forEach(cls => {
    cls.timeSlots.forEach(slot => {
      // Calcular o índice do dia e do horário com base no número do slot
      const dayIndex = Math.floor((slot - 1) / 14); // Cada dia tem 16 slots
      const hourIndex = (slot - 1) % 14;           // Ajusta para o índice correto no dia

      if (dayIndex >= 0 && hourIndex >= 0) {
        scheduleMatrix[hourIndex][dayIndex] = cls;
      }
    });
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="px-2 py-2 text-xs text-gray-400 border border-gray-700 bg-gray-800"></th>
            {days.map(day => (
              <th key={day} className="px-2 py-2 text-center text-xs font-medium text-gray-300 border border-gray-700 bg-gray-800">
                {day}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {timeSlots.map((time, rowIndex) => (
            <tr key={time}>
              <td className="px-2 py-1 text-xs text-gray-400 border border-gray-700 bg-gray-800 whitespace-nowrap">
                {time}
              </td>

              {days.map((day, colIndex) => {
                const classData = scheduleMatrix[rowIndex][colIndex];

                return (
                  <td
                    key={`${day}-${time}`}
                    className={`px-2 py-2 text-xs text-center border border-gray-700 ${
                      classData ? courseColors[classData.courseId] : 'bg-gray-800'
                    }`}
                  >
                    {classData && (
                      <div className="flex flex-col">
                        <span className="font-bold text-white">{classData.courseId}</span>
                        <span className="text-gray-300 text-[10px]">{classData.classCode}</span>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WeeklyScheduleView;