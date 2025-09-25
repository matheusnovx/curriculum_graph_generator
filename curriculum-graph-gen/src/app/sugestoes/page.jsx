'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WeeklyScheduleView from '../components/WeeklyScheduleView';

function convertSlotToReadable(slot) {
  const days = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  const baseHour = {
    1: '07:30', 2: '08:20', 3: '09:10', 4: '10:10', 5: '11:50',
    8: '13:30', 9: '14:20', 10: '15:10', 11: '16:20', 12: '17:10',
    13: '18:30', 14: '19:20', 15: '20:20', 16: '21:20'
  };

  const dayIndex = Math.floor((slot - 1) / 16); // Cada dia tem 16 slots
  const hourIndex = slot % 16 || 16; // Ajusta para o índice correto no dia

  const day = days[dayIndex] || 'N/A';
  const hour = baseHour[hourIndex] || 'N/A';

  return `${day} ${hour}`;
}

export default function SugestoesPage() {
  const router = useRouter();
  const [studentData, setStudentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [suggestedSchedule, setSuggestedSchedule] = useState(null);
  const [availableCourses, setAvailableCourses] = useState([]);
  
  // Formulário de preferências
  const [maxWorkload, setMaxWorkload] = useState(24); // Padrão: 24 horas
  const [semester, setSemester] = useState('');
  const [avoidDays, setAvoidDays] = useState([]);
  const [preferredTimes, setPreferredTimes] = useState([]);
  
  // Carregar dados do aluno do localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('parsedPdfData');
    if (savedData) {
      try {
        setStudentData(JSON.parse(savedData));
      } catch (error) {
        console.error('Failed to parse saved data:', error);
        setErrorMessage('Não foi possível carregar seus dados. Por favor, faça upload novamente.');
      }
    } else {
      setErrorMessage('Você precisa fazer upload do seu histórico primeiro.');
    }
    
    // Definir o semestre atual como padrão
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    // Se estamos depois de julho, sugerimos o semestre 1 do próximo ano, senão o semestre 2 do ano atual
    const defaultSemester = currentMonth >= 6 
      ? `${currentYear + 1}.1` 
      : `${currentYear}.2`;
    setSemester(defaultSemester);
  }, []);
  
  // Toggle para dias a evitar
  const toggleAvoidDay = (day) => {
    setAvoidDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day) 
        : [...prev, day]
    );
  };
  
  // Toggle para horários preferidos
  const togglePreferredTime = (time) => {
    setPreferredTimes(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time) 
        : [...prev, time]
    );
  };
  
  // Buscar sugestões de matrícula
  const fetchSuggestions = async () => {
    if (!studentData) {
      setErrorMessage('Você precisa fazer upload do seu histórico primeiro.');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
    const response = await fetch('/api/sugestoes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentProgress: studentData,
        curriculumId: studentData.curriculumId,
        courseCode: parseInt(studentData.courseCode, 10),
        maxWorkload,
        semester,
        avoidDays,
        preferredTimes
      }),
    });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao gerar sugestões');
      }
      
      const data = await response.json();
      setSuggestedSchedule(data.suggestedSchedule);
      setAvailableCourses(data.availableCourses);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setErrorMessage(error.message || 'Falha ao gerar sugestões de matrícula');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <main className="container mx-auto px-4 py-8 min-h-screen">      
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-800 text-white rounded-lg">
          <p>{errorMessage}</p>
          {!studentData && (
            <button 
              onClick={() => router.push('/student-progress')}
              className="mt-2 bg-white text-red-800 px-4 py-2 rounded font-medium"
            >
              Ir para Upload de Histórico
            </button>
          )}
        </div>
      )}
      
      {studentData && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Coluna de preferências */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 p-4 rounded-lg text-white">
              <h2 className="text-lg font-semibold mb-3 border-b border-gray-700 pb-2">
                Suas Preferências
              </h2>
              
              <div className="space-y-4">
                {/* Semestre */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Semestre
                  </label>
                  <input
                    type="text"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    placeholder="Ex: 2023.1"
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formato: AAAA.S (Ex: 2023.1 ou 2023.2)
                  </p>
                </div>
                
                {/* Carga horária máxima */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Carga Horária Máxima
                  </label>
                  <div className="flex items-center">
                    <input
                      type="range"
                      min="8"
                      max="32"
                      step="4"
                      value={maxWorkload}
                      onChange={(e) => setMaxWorkload(Number(e.target.value))}
                      className="w-full"
                    />
                    <span className="ml-2 text-white">{maxWorkload}h</span>
                  </div>
                </div>
                
                {/* Dias a evitar */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Dias a Evitar
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(day => (
                      <button
                        key={day}
                        onClick={() => toggleAvoidDay(day)}
                        className={`px-3 py-1 text-xs rounded-full ${
                          avoidDays.includes(day)
                            ? 'bg-red-700 text-white'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Horários preferidos */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Horários Preferidos
                  </label>
                  <div className="flex gap-2">
                    {['Manhã', 'Tarde', 'Noite'].map(time => (
                      <button
                        key={time}
                        onClick={() => togglePreferredTime(time)}
                        className={`px-3 py-1 text-xs rounded-full ${
                          preferredTimes.includes(time)
                            ? 'bg-green-700 text-white'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Botão de gerar sugestões */}
                <button
                  onClick={fetchSuggestions}
                  disabled={isLoading}
                  className={`w-full py-2 rounded-md font-medium ${
                    isLoading
                      ? 'bg-blue-900 text-blue-300'
                      : 'bg-blue-700 hover:bg-blue-600 text-white'
                  }`}
                >
                  {isLoading ? 'Gerando Sugestões...' : 'Gerar Sugestões de Matrícula'}
                </button>
              </div>
            </div>
            
            {/* Disciplinas disponíveis */}
            {availableCourses.length > 0 && (
              <div className="mt-6 bg-gray-800 p-4 rounded-lg text-white">
                <h2 className="text-lg font-semibold mb-3 border-b border-gray-700 pb-2">
                  Disciplinas Disponíveis ({availableCourses.length})
                </h2>
                
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="text-gray-400">
                      <tr>
                        <th className="text-left py-2">Disciplina</th>
                        <th className="text-center py-2">Desbloqueio potencial</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableCourses
                        .sort((a, b) => b.unlockScore - a.unlockScore)
                        .map(course => (
                          <tr key={course.courseId} className="border-t border-gray-700">
                            <td className="py-2">
                              <div className="font-medium">{course.courseId}</div>
                              <div className="text-xs text-gray-400">{course.courseName}</div>
                            </td>
                            <td className="text-center py-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                course.unlockScore > 5 
                                  ? 'bg-green-900 text-green-300' 
                                  : course.unlockScore > 0
                                    ? 'bg-blue-900 text-blue-300'
                                    : 'bg-gray-700 text-gray-400'
                              }`}>
                                {course.unlockScore}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          
          {/* Coluna de resultados */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex items-center justify-center h-96 bg-gray-800 rounded-lg">
                <div className="text-center text-white">
                  <svg className="animate-spin h-10 w-10 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p>Gerando suas sugestões de matrícula...</p>
                </div>
              </div>
            ) : suggestedSchedule ? (
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Seu Horário Sugerido</h2>
                    <div className="text-sm text-gray-300">
                      {suggestedSchedule.totalCourses} disciplina(s) • 
                      {suggestedSchedule.totalWeeklyHours} horas semanais
                    </div>
                  </div>
                  
                  {/* Visualização do horário semanal */}
                  <WeeklyScheduleView classes={suggestedSchedule.classes} />
                  
                  {/* Lista de disciplinas sugeridas */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Disciplinas Sugeridas</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {suggestedSchedule.classes.map((cls, index) => (
                        <div key={cls.classId || `${cls.courseId}-${index}`} className="bg-gray-700 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold text-white">{cls.courseId}</h4>
                              <p className="text-sm text-gray-300">{cls.courseName}</p>
                            </div>
                            <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded-full text-xs">
                              {cls.weeklyHours}h/semana
                            </span>
                          </div>

                          <div className="text-sm text-gray-400 mb-2">
                            Turma: {cls.classCode || 'Não informado'}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                              {cls.timeSlots?.map(slot => (
                                <span key={slot} className="bg-gray-600 text-gray-300 px-2 py-1 rounded-md text-xs">
                                  {convertSlotToReadable(slot)}
                                </span>
                              ))}
                            </div>

                            <div className="text-xs text-white bg-green-800 px-2 py-1 rounded-full">
                              Desbloqueio: {cls.unlockScore || 0}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 bg-gray-800 rounded-lg">
                <div className="text-center p-8 max-w-md text-white">
                  <h2 className="text-2xl font-bold mb-4">Planejador de Semestre Inteligente</h2>
                  <p className="mb-4">
                    Defina suas preferências e gere um horário otimizado para o próximo semestre.
                    O sistema escolherá as disciplinas mais estratégicas para seu avanço no curso.
                  </p>
                  <p className="text-sm text-gray-400">
                    Configure suas preferências no painel ao lado e clique em "Gerar Sugestões"
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}