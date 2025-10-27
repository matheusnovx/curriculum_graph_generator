'use client';

import React from 'react';

const WeeklyScheduleView = ({ classes }) => {
  const timeSlots = [
    '07:30', '08:20', '09:10', '10:10', '11:00',
    '13:30', '14:20', '15:10', '16:20', '17:10',
    '18:30', '19:20', '20:10', '21:00'
  ];

  const days = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

  const colors = [
    'bg-blue-700/90 hover:bg-blue-600 border-l-4 border-blue-400',
    'bg-emerald-700/90 hover:bg-emerald-600 border-l-4 border-emerald-400',
    'bg-violet-700/90 hover:bg-violet-600 border-l-4 border-violet-400',
    'bg-rose-700/90 hover:bg-rose-600 border-l-4 border-rose-400',
    'bg-amber-700/90 hover:bg-amber-600 border-l-4 border-amber-400',
    'bg-cyan-700/90 hover:bg-cyan-600 border-l-4 border-cyan-400',
    'bg-indigo-700/90 hover:bg-indigo-600 border-l-4 border-indigo-400',
    'bg-teal-700/90 hover:bg-teal-600 border-l-4 border-teal-400'
  ];

  const courseColors = {};
  classes.forEach((cls, index) => {
    courseColors[cls.courseId] = colors[index % colors.length];
  });

  const scheduleMatrix = Array(timeSlots.length).fill().map(() => Array(days.length).fill(null));

  function mapSlotToIndex(slot) {
    const dayIndex = Math.floor((slot - 1) / 16); // Cada dia tem 16 slots
    const slotWithinDay = (slot - 1) % 16 + 1;
    
    let hourIndex = null;
    
    // Manhã
    if (slotWithinDay >= 1 && slotWithinDay <= 5) {
      hourIndex = slotWithinDay - 1; 
    }
    // Tarde
    else if (slotWithinDay >= 8 && slotWithinDay <= 12) {
      hourIndex = slotWithinDay - 3;
    }
    // Noite
    else if (slotWithinDay >= 13 && slotWithinDay <= 16) {
      hourIndex = slotWithinDay - 3;
    }
    
    return { dayIndex, hourIndex };
  }

  // Preencher a matriz com as aulas
  classes.forEach(cls => {
    cls.timeSlots.forEach(slot => {
      const { dayIndex, hourIndex } = mapSlotToIndex(slot);
      
      if (dayIndex >= 0 && dayIndex < days.length && hourIndex !== null && hourIndex < timeSlots.length) {
        scheduleMatrix[hourIndex][dayIndex] = cls;
      } else {
        console.warn(`Slot ${slot} não mapeado corretamente: dayIndex=${dayIndex}, hourIndex=${hourIndex}`);
      }
    });
  });

  // Função para agrupar os horários por turno
  const groupTimeSlots = () => {
    const morningSlots = timeSlots.slice(0, 5);
    const afternoonSlots = timeSlots.slice(5, 10);
    const eveningSlots = timeSlots.slice(10);
    
    return [
      { title: 'Manhã', slots: morningSlots },
      { title: 'Tarde', slots: afternoonSlots },
      { title: 'Noite', slots: eveningSlots }
    ];
  };

  const groupedTimeSlots = groupTimeSlots();

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse shadow-lg rounded-lg overflow-hidden">
        <thead>
          <tr className="h-12 bg-gray-800 text-white">
            {/* Coluna vazia para horários */}
            <th className="w-20 px-2 border-b border-gray-700"></th>
            
            {days.map(day => (
              <th 
                key={day} 
                className="px-3 py-3 text-center text-sm font-semibold text-gray-200 border-b border-gray-700"
                style={{ width: `${100/days.length}%` }}
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {groupedTimeSlots.map((group, groupIndex) => (
            <React.Fragment key={group.title}>
              {/* Título do período */}
              <tr className="h-8 bg-gray-900/30">
                <td className="pl-2 pr-4 text-right text-sm font-medium text-gray-400 border-0">
                  {group.title}
                </td>
                <td colSpan={days.length} className="border-0"></td>
              </tr>
              
              {/* Linhas de horário para esse período */}
              {group.slots.map((time, rowIndex) => {
                const actualRowIndex = groupIndex === 0 
                  ? rowIndex 
                  : groupIndex === 1 
                    ? rowIndex + 5 
                    : rowIndex + 10;
                
                return (
                  <tr key={time} className="h-14">
                    {/* Célula de horário */}
                    <td className="pl-2 pr-4 text-right text-xs font-medium text-gray-400 whitespace-nowrap">
                      {time}
                    </td>

                    {/* Células de aulas */}
                    {days.map((day, colIndex) => {
                      const classData = scheduleMatrix[actualRowIndex][colIndex];

                      return (
                        <td
                          key={`${day}-${time}`}
                          className={`p-2 text-xs text-center border border-gray-700 transition-all duration-200 ${
                            classData ? courseColors[classData.courseId] : 'bg-gray-800/80 hover:bg-gray-800'
                          }`}
                        >
                          {classData && (
                            <div className="flex flex-col h-full justify-center">
                              <span className="font-bold text-white text-sm">{classData.courseId}</span>
                              <span className="text-gray-200 text-xs mt-1">{classData.className || classData.classCode}</span>
                              {classData.professorName && (
                                <span className="text-gray-300 text-[10px] mt-1 italic truncate max-w-full">
                                  {classData.professorName}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WeeklyScheduleView;