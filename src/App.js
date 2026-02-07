import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from './firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';

// Mock data initialization with admin password set to 1234
const initialExams = [
  {
    id: 1,
    name: 'Examen de Matemáticas',
    description: 'Álgebra y geometría básica',
    questions: [
      {
        id: 1,
        text: '¿Cuánto es 2+2?',
        options: [
          { id: 1, text: '3' },
          { id: 2, text: '4' },
          { id: 3, text: '5' },
          { id: 4, text: '6' }
        ],
        correctOptionId: 2
      },
      {
        id: 2,
        text: '¿Cuál es el área de un cuadrado de lado 4?',
        options: [
          { id: 1, text: '8' },
          { id: 2, text: '12' },
          { id: 3, text: '16' },
          { id: 4, text: '20' }
        ],
        correctOptionId: 3
      }
    ]
  }
];

const initialGroups = [
  { id: 1, name: 'Grupo A', members: ['12345678', '23456789'] },
  { id: 2, name: 'Grupo B', members: ['34567890'] }
];

// ADMIN PASSWORD SET TO 1234 AS REQUESTED
const initialUsers = [
  { dni: 'admin', password: '1234', name: 'Administrador', role: 'admin', status: 'active', groupIds: [] },
  { dni: '12345678', password: '1234', name: 'Juan Pérez', role: 'student', groupIds: [1], status: 'active' },
  { dni: '23456789', password: '5678', name: 'María García', role: 'student', groupIds: [1], status: 'active' },
  { dni: '34567890', password: '9012', name: 'Carlos López', role: 'student', groupIds: [2], status: 'active' }
];

const initialHabilitations = [
  { id: 1, examId: 1, groupId: 1, showScore: true }
];

const initialResults = [
  {
    studentDni: '12345678',
    examId: 1,
    score: 10,
    total: 10,
    date: '2026-02-01',
    answers: {
      1: 2,
      2: 3
    },
    showScore: true
  },
  {
    studentDni: '23456789',
    examId: 1,
    score: 5,
    total: 10,
    date: '2026-02-01',
    answers: {
      1: 1,
      2: 3
    },
    showScore: true
  }
];

// Save data to Firebase
const saveToFirebase = async (collectionName, data) => {
  try {
    await setDoc(doc(db, collectionName, 'data'), { items: data });
  } catch (error) {
    console.error(`Error saving ${collectionName} to Firebase:`, error);
  }
};

// Load data from Firebase
const loadFromFirebase = async (collectionName, defaultData) => {
  try {
    const docSnap = await getDoc(doc(db, collectionName, 'data'));
    if (docSnap.exists() && docSnap.data().items) {
      return docSnap.data().items;
    } else {
      return defaultData;
    }
  } catch (error) {
    console.error(`Error loading ${collectionName} from Firebase:`, error);
    return defaultData;
  }
};

export default function App() {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Login form states
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [studentDni, setStudentDni] = useState('');
  const [studentPass, setStudentPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Page navigation state
  const [currentPage, setCurrentPage] = useState('login');
  const [adminSection, setAdminSection] = useState('exams');

  // Form states
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [showEditExam, setShowEditExam] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showHabilitar, setShowHabilitar] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showResultDetail, setShowResultDetail] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteHabilitacionModal, setShowDeleteHabilitacionModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [showDeleteExamModal, setShowDeleteExamModal] = useState(false);
  const [habilitationToDelete, setHabilitationToDelete] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [examToDelete, setExamToDelete] = useState(null);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  // Search states for users
  const [searchQuery, setSearchQuery] = useState('');
  const [searchByGroup, setSearchByGroup] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Import users states
  const [showImportUsersModal, setShowImportUsersModal] = useState(false); 
  const [importFile, setImportFile] = useState(null); 
  const [importPreview, setImportPreview] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  // Data states - Load from Firebase
  const [exams, setExams] = useState([]);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [habilitations, setHabilitations] = useState([]);
  const [results, setResults] = useState([]);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Form inputs
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [examName, setExamName] = useState('');
  const [examDescription, setExamDescription] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedResultGroup, setSelectedResultGroup] = useState('all');
  const [selectedResultExam, setSelectedResultExam] = useState('all');
  const [registerName, setRegisterName] = useState('');
  const [registerLastName, setRegisterLastName] = useState('');
  const [registerDni, setRegisterDni] = useState('');
  const [registerPass, setRegisterPass] = useState('');
  const [showScore, setShowScore] = useState(true);

  // Edit user states
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDni, setEditDni] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editGroups, setEditGroups] = useState([]);
  const [editStatus, setEditStatus] = useState('');

  // Exam creation states
  const [examQuestions, setExamQuestions] = useState([
    {
      id: Date.now(),
      text: '',
      options: [
        { id: Date.now() + 1, text: '' },
        { id: Date.now() + 2, text: '' },
        { id: Date.now() + 3, text: '' }
      ],
      correctOptionId: null
    }
  ]);

  // Edit exam states
  const [editingExam, setEditingExam] = useState(null);

  // Result detail states
  const [selectedResult, setSelectedResult] = useState(null);

  // Student exam state
  const [currentExam, setCurrentExam] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [showScoreForSubmittedExam, setShowScoreForSubmittedExam] = useState(false);

  // Load data from Firebase on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      const loadedExams = await loadFromFirebase('exams', initialExams);
      const loadedGroups = await loadFromFirebase('groups', initialGroups);
      const loadedUsers = await loadFromFirebase('users', initialUsers);
      const loadedHabilitations = await loadFromFirebase('habilitations', initialHabilitations);
      const loadedResults = await loadFromFirebase('results', initialResults);
      
      setExams(loadedExams);
      setGroups(loadedGroups);
      setUsers(loadedUsers);
      setHabilitations(loadedHabilitations);
      setResults(loadedResults);
      
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  // Handle login
  const handleLogin = (role) => {
    setLoginError('');
    let user;
    if (role === 'admin') {
      user = users.find(u =>
        u.role === 'admin' &&
        u.dni === adminUser &&
        u.password === adminPass &&
        u.status === 'active'
      );
    } else {
      user = users.find(u =>
        u.role === 'student' &&
        u.dni === studentDni &&
        u.password === studentPass &&
        u.status === 'active'
      );
    }
    if (user) {
      setIsLoggedIn(true);
      setUserRole(role);
      setCurrentUser(user);
      setCurrentPage(role === 'admin' ? 'admin' : 'student');
      setAdminSection('exams');
      setAdminUser('');
      setAdminPass('');
      setStudentDni('');
      setStudentPass('');
    } else {
      setLoginError('Usuario o contraseña incorrectos. Verifica tus credenciales.');
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole('');
    setCurrentUser(null);
    setCurrentPage('login');
    setLoginError('');
  };

  // Create or Edit group
  const handleCreateGroup = async () => {
    if (groupName.trim() === '') {
      alert('El nombre del grupo no puede estar vacío');
      return;
    }

    try {
      if (isEditingGroup && editingExam) {
        const updatedGroups = groups.map(g =>
          g.id === editingExam.id
            ? { ...g, name: groupName, members: groupMembers }
            : g
        );
        setGroups(updatedGroups);
        await saveToFirebase('groups', updatedGroups);
        alert('Grupo actualizado exitosamente');
      } else {
        const newGroup = {
          id: groups.length > 0 ? Math.max(...groups.map(g => g.id)) + 1 : 1,
          name: groupName,
          members: groupMembers
        };
        setGroups([...groups, newGroup]);
        await saveToFirebase('groups', [...groups, newGroup]);
        alert('Grupo creado exitosamente');
      }
      
      // Reset form and close modal
      setGroupName('');
      setGroupMembers([]);
      setShowCreateGroup(false);
      setIsEditingGroup(false);
      setEditingExam(null);
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Error al crear el grupo. Por favor, intenta de nuevo.');
      setShowCreateGroup(false);
    }
  };

  // Add question to exam
  const addQuestion = () => {
    setExamQuestions([
      ...examQuestions,
      {
        id: Date.now() + examQuestions.length,
        text: '',
        options: [
          { id: Date.now() + examQuestions.length * 10 + 1, text: '' },
          { id: Date.now() + examQuestions.length * 10 + 2, text: '' },
          { id: Date.now() + examQuestions.length * 10 + 3, text: '' }
        ],
        correctOptionId: null
      }
    ]);
  };

  // Add option to question
  const addOption = (questionId) => {
    setExamQuestions(examQuestions.map(q =>
      q.id === questionId
        ? {
          ...q,
          options: [
            ...q.options,
            { id: Date.now() + q.options.length, text: '' }
          ]
        }
        : q
    ));
  };

  // Remove option from question
  const removeOption = (questionId, optionId) => {
    setExamQuestions(examQuestions.map(q =>
      q.id === questionId && q.options.length > 2
        ? {
          ...q,
          options: q.options.filter(o => o.id !== optionId),
          correctOptionId: q.correctOptionId === optionId ? null : q.correctOptionId
        }
        : q
    ));
  };

  // Remove question from exam
  const removeQuestion = (questionId) => {
    if (examQuestions.length > 1) {
      setExamQuestions(examQuestions.filter(q => q.id !== questionId));
    } else {
      alert('Debe haber al menos una pregunta en el examen');
    }
  };

  // Create exam with questions
  const handleCreateExam = async () => {
    if (examName.trim() === '') {
      alert('El nombre del examen es obligatorio');
      return;
    }
    // Validate questions
    for (const question of examQuestions) {
      if (question.text.trim() === '') {
        alert('Todas las preguntas deben tener texto');
        return;
      }
      for (const option of question.options) {
        if (option.text.trim() === '') {
          alert('Todas las opciones deben tener texto');
          return;
        }
      }
      if (question.correctOptionId === null) {
        alert('Debes seleccionar una respuesta correcta para cada pregunta');
        return;
      }
    }
    try {
      const newExam = {
        id: exams.length > 0 ? Math.max(...exams.map(e => e.id)) + 1 : 1,
        name: examName,
        description: examDescription,
        questions: examQuestions.map(q => ({
          id: q.id,
          text: q.text,
          options: q.options.map(o => ({ id: o.id, text: o.text })),
          correctOptionId: q.correctOptionId
        }))
      };
      const updatedExams = [...exams, newExam];
      setExams(updatedExams);
      await saveToFirebase('exams', updatedExams);
      
      // Reset form and close modal IMMEDIATELY
      setExamName('');
      setExamDescription('');
      setExamQuestions([{
        id: Date.now(),
        text: '',
        options: [
          { id: Date.now() + 1, text: '' },
          { id: Date.now() + 2, text: '' },
          { id: Date.now() + 3, text: '' }
        ],
        correctOptionId: null
      }]);
      setShowCreateExam(false);
      setShowEditExam(false);
      setEditingExam(null);
      
      alert('Examen creado exitosamente');
    } catch (error) {
      console.error('Error creating exam:', error);
      alert('Error al crear el examen. Por favor, intenta de nuevo.');
      setShowCreateExam(false);
      setShowEditExam(false);
    }
  };

  // Edit exam
  const handleEditExam = async () => {
    if (!editingExam) return;
    if (examName.trim() === '') {
      alert('El nombre del examen es obligatorio');
      return;
    }
    // Validate questions
    for (const question of examQuestions) {
      if (question.text.trim() === '') {
        alert('Todas las preguntas deben tener texto');
        return;
      }
      for (const option of question.options) {
        if (option.text.trim() === '') {
          alert('Todas las opciones deben tener texto');
          return;
        }
      }
      if (question.correctOptionId === null) {
        alert('Debes seleccionar una respuesta correcta para cada pregunta');
        return;
      }
    }
    try {
      const updatedExams = exams.map(exam =>
        exam.id === editingExam.id
          ? {
            ...exam,
            name: examName,
            description: examDescription,
            questions: examQuestions.map(q => ({
              id: q.id,
              text: q.text,
              options: q.options.map(o => ({ id: o.id, text: o.text })),
              correctOptionId: q.correctOptionId
            }))
          }
          : exam
      );
      setExams(updatedExams);
      await saveToFirebase('exams', updatedExams);
      
      // Close modal and reset
      setShowEditExam(false);
      setEditingExam(null);
      
      alert('Examen actualizado exitosamente');
    } catch (error) {
      console.error('Error editing exam:', error);
      alert('Error al actualizar el examen. Por favor, intenta de nuevo.');
      setShowEditExam(false);
    }
  };

  // Update admin account (username and password)
  const handleUpdateAccount = async () => {
    if (currentPassword !== currentUser.password) {
      alert('La contraseña actual es incorrecta');
      return;
    }
    if (newUsername.trim() === '' && newPassword.trim() === '') {
      alert('Debe ingresar al menos un nuevo usuario o contraseña');
      return;
    }
    // Check if new username is already taken (excluding current user)
    if (newUsername.trim() !== '' && newUsername !== currentUser.dni) {
      const existingUser = users.find(u => u.dni === newUsername.trim() && u.dni !== currentUser.dni);
      if (existingUser) {
        alert('El nombre de usuario ya está en uso');
        return;
      }
    }
    // Update user data
    const updatedUsers = users.map(user => {
      if (user.dni === currentUser.dni) {
        return {
          ...user,
          dni: newUsername.trim() !== '' ? newUsername.trim() : user.dni,
          password: newPassword.trim() !== '' ? newPassword.trim() : user.password
        };
      }
      return user;
    });
    // Update current user
    const updatedUser = updatedUsers.find(u => u.dni === (newUsername.trim() !== '' ? newUsername.trim() : currentUser.dni));
    setUsers(updatedUsers);
    await saveToFirebase('users', updatedUsers);
    setCurrentUser(updatedUser);
    // Update login credentials if changed
    if (newUsername.trim() !== '') {
      setAdminUser(newUsername.trim());
    }
    if (newPassword.trim() !== '') {
      setAdminPass(newPassword.trim());
    }
    setCurrentPassword('');
    setNewUsername('');
    setNewPassword('');
    setShowAccountSettings(false);
    alert('Datos de cuenta actualizados exitosamente');
  };

  // Change password for current user
  const handleChangePassword = async () => {
    if (currentPassword !== currentUser.password) {
      alert('La contraseña actual es incorrecta');
      return;
    }
    if (newPassword.trim() === '') {
      alert('La nueva contraseña no puede estar vacía');
      return;
    }
    const updatedUsers = users.map(user =>
      user.dni === currentUser.dni
        ? { ...user, password: newPassword.trim() }
        : user
    );
    setUsers(updatedUsers);
    await saveToFirebase('users', updatedUsers);
    setCurrentPassword('');
    setNewPassword('');
    setShowChangePassword(false);
    alert('Contraseña actualizada exitosamente');
  };

  // Edit user
  const handleEditUser = async () => {
    if (!editingUser) return;
    // Validate DNI uniqueness if changed
    if (editDni !== editingUser.dni) {
      const existingUser = users.find(u => u.dni === editDni && u.dni !== editingUser.dni);
      if (existingUser) {
        alert('El DNI ya está en uso por otro usuario');
        return;
      }
    }
    // Update user data
    const updatedUsers = users.map(user => {
      if (user.dni === editingUser.dni) {
        return {
          ...user,
          name: editName,
          dni: editDni,
          password: editPassword.trim() !== '' ? editPassword : user.password,
          role: editRole,
          groupIds: editRole === 'student' ? editGroups : [],
          status: editStatus
        };
      }
      return user;
    });
    setUsers(updatedUsers);
    await saveToFirebase('users', updatedUsers);
    setShowEditUser(false);
    setEditingUser(null);
    alert('Usuario actualizado exitosamente');
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    // Prevent deleting the current user
    if (userToDelete.dni === currentUser?.dni) {
      alert('No puedes eliminar tu propia cuenta mientras estás conectado');
      setShowDeleteUserModal(false);
      setUserToDelete(null);
      return;
    }

    try {
      // Remove user from all groups
      const updatedGroups = groups.map(group => ({
        ...group,
        members: group.members.filter(memberDni => memberDni !== userToDelete.dni)
      }));

      // Remove user's results
      const updatedResults = results.filter(result => result.studentDni !== userToDelete.dni);

      // Remove user
      const updatedUsers = users.filter(user => user.dni !== userToDelete.dni);

      setUsers(updatedUsers);
      setGroups(updatedGroups);
      setResults(updatedResults);
      
      await saveToFirebase('users', updatedUsers);
      await saveToFirebase('groups', updatedGroups);
      await saveToFirebase('results', updatedResults);
      
      // Close modal IMMEDIATELY
      setShowDeleteUserModal(false);
      setUserToDelete(null);
      
      alert('Usuario eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar el usuario. Por favor, intenta de nuevo.');
      setShowDeleteUserModal(false);
      setUserToDelete(null);
    }
  };

  // Approve student registration
  const handleApproveStudent = (dni) => {
    const student = users.find(u => u.dni === dni);
    if (!student) return;
    setEditingUser(student);
    setEditName(student.name);
    setEditDni(student.dni);
    setEditPassword('');
    setEditRole('student');
    setEditGroups(student.groupIds || []);
    setEditStatus('active');
    setShowApproveModal(true);
  };

  // Habilitar examen
  const handleHabilitar = async () => {
    if (!selectedExam || !selectedGroup) {
      alert('Selecciona un examen y un grupo');
      return;
    }
    const examId = parseInt(selectedExam);
    const groupId = parseInt(selectedGroup);
    if (habilitations.some(h => h.examId === examId && h.groupId === groupId)) {
      alert('Esta habilitación ya existe');
      return;
    }
    try {
      const newHabilitation = {
        id: habilitations.length > 0 ? Math.max(...habilitations.map(h => h.id)) + 1 : 1,
        examId,
        groupId,
        showScore
      };
      const updatedHabilitations = [...habilitations, newHabilitation];
      setHabilitations(updatedHabilitations);
      await saveToFirebase('habilitations', updatedHabilitations);
      
      setSelectedExam('');
      setSelectedGroup('');
      setShowHabilitar(false);
      
      alert('Examen habilitado exitosamente para el grupo seleccionado');
    } catch (error) {
      console.error('Error enabling exam:', error);
      alert('Error al habilitar el examen. Por favor, intenta de nuevo.');
      setShowHabilitar(false);
    }
  };

  // Delete habilitation confirmation
  const confirmDeleteHabilitacion = (habilitationId) => {
    setHabilitationToDelete(habilitationId);
    setShowDeleteHabilitacionModal(true);
  };

  // Delete habilitation
  const handleDeleteHabilitacion = async () => {
    if (habilitationToDelete) {
      try {
        const updatedHabilitations = habilitations.filter(h => h.id !== habilitationToDelete);
        setHabilitations(updatedHabilitations);
        await saveToFirebase('habilitations', updatedHabilitations);
        
        setShowDeleteHabilitacionModal(false);
        setHabilitationToDelete(null);
        
        alert('Habilitación eliminada exitosamente');
      } catch (error) {
        console.error('Error deleting habilitation:', error);
        alert('Error al eliminar la habilitación. Por favor, intenta de nuevo.');
        setShowDeleteHabilitacionModal(false);
        setHabilitationToDelete(null);
      }
    }
  };

  // Register new student (pending approval)
  const handleRegister = async () => {
    if (!registerDni || !registerPass || !registerName || !registerLastName) {
      alert('Todos los campos son obligatorios');
      return;
    }
    if (users.some(u => u.dni === registerDni)) {
      alert('Ya existe un usuario con este DNI');
      return;
    }
    try {
      const newStudent = {
        dni: registerDni,
        password: registerPass,
        name: `${registerName} ${registerLastName}`,
        role: 'student',
        groupIds: [],
        status: 'pending'
      };
      const updatedUsers = [...users, newStudent];
      setUsers(updatedUsers);
      await saveToFirebase('users', updatedUsers);
      
      // Reset form and close modal IMMEDIATELY
      setRegisterName('');
      setRegisterLastName('');
      setRegisterDni('');
      setRegisterPass('');
      setShowRegister(false);
      
      alert('Registro exitoso. Tu cuenta será activada por un administrador.');
    } catch (error) {
      console.error('Error registering user:', error);
      alert('Error al registrar. Por favor, intenta de nuevo.');
      setShowRegister(false);
    }
  };

  // Start exam
  const handleStartExam = (examId) => {
    const exam = exams.find(e => e.id === examId);
    if (!exam) {
      alert('Examen no encontrado');
      return;
    }
    setCurrentExam(exam);
    setStudentAnswers({});
    setExamSubmitted(false);
    // Check if score should be shown for this exam
    const examHabilitation = habilitations.find(h =>
      h.examId === examId &&
      currentUser.groupIds.includes(h.groupId)
    );
    setShowScoreForSubmittedExam(examHabilitation?.showScore || false);
  };

  // Submit exam - CORREGIDA PARA EVITAR DUPLICADOS Y MOSTRAR MENSAJE CORRECTO
  const handleSubmitExam = async () => {
    // 🔒 Bloquear si ya se está enviando o ya fue enviado
    if (isSubmitting) {
      alert('Enviando examen, por favor espera...');
      return;
    }
    
    if (examSubmitted) {
      alert('Este examen ya fue enviado. No se pueden modificar las respuestas.');
      return;
    }

    // 🔍 Verificar si ya existe un resultado para este examen y estudiante
    const existingResult = results.find(r => 
      r.studentDni === currentUser.dni && 
      r.examId === currentExam.id
    );
    
    if (existingResult) {
      alert('Ya has enviado este examen anteriormente. No se permiten reenvíos.');
      setExamSubmitted(true);
      return;
    }

    // ✅ Validar que todas las preguntas estén respondidas
    if (Object.keys(studentAnswers).length !== currentExam.questions.length) {
      alert('Debe responder todas las preguntas antes de enviar.');
      return;
    }

    // 🚧 Activar estado de envío para bloquear botón
    setIsSubmitting(true);

    try {
      // 📊 Calcular puntaje
      let score = 0;
      currentExam.questions.forEach(question => {
        if (studentAnswers[question.id] === question.correctOptionId) {
          score += 1;
        }
      });

      // 🔐 Obtener configuración de visibilidad de nota
      const examHabilitation = habilitations.find(h =>
        h.examId === currentExam.id &&
        currentUser.groupIds.includes(h.groupId)
      );

      // 📝 Crear resultado
      const newResult = {
        studentDni: currentUser.dni,
        examId: currentExam.id,
        score: score * 10 / currentExam.questions.length,
        total: 10,
        date: new Date().toISOString().split('T')[0],
        answers: { ...studentAnswers },
        showScore: examHabilitation?.showScore || false
      };

      // 💾 Guardar en Firebase
      const updatedResults = [...results, newResult];
      setResults(updatedResults);
      await saveToFirebase('results', updatedResults);

      // ✅ Marcar como enviado y mostrar mensaje apropiado
      setExamSubmitted(true);
      
      if (examHabilitation?.showScore) {
        alert(`✅ Examen enviado exitosamente.\nTu nota es: ${newResult.score}/10`);
      } else {
        alert('✅ Examen enviado exitosamente.\nTu nota será publicada próximamente por el administrador.');
      }
      
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('❌ Error al enviar el examen. Por favor, intenta nuevamente.');
    } finally {
      // 🚫 Desbloquear botón siempre (éxito o error)
      setIsSubmitting(false);
    }
  };

  // Delete exam confirmation
  const confirmDeleteExam = (examId) => {
    setExamToDelete(examId);
    setShowDeleteExamModal(true);
  };
  // Download template CSV
const downloadTemplate = () => {
  const template = `DNI;Nombre;Apellido;Contraseña;Grupo\n12345678;Juan;Pérez;1234;Grupo A\n23456789;María;García;5678;Grupo A\n34567890;Carlos;López;9012;Grupo B`;
  
  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'plantilla_usuarios.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Handle file selection for import
const handleFileSelect = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  setImportFile(file);
  setImportErrors([]);
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const csvData = event.target.result;
      const lines = csvData.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setImportErrors(['El archivo está vacío o no tiene datos']);
        return;
      }
      
      const headers = lines[0].split(';').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['dni', 'nombre', 'apellido', 'contraseña', 'grupo'];
      const missing = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missing.length > 0) {
        setImportErrors([`Faltan columnas: ${missing.join(', ')}`]);
        return;
      }
      
      const preview = [];
      const errors = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(';').map(v => v.trim());
        if (values.length < 5) continue;
        
        const row = {
          dni: values[0],
          nombre: values[1],
          apellido: values[2],
          contraseña: values[3],
          grupo: values[4]
        };
        
        const rowErrors = [];
        
        if (row.dni.length < 6) rowErrors.push('DNI muy corto');
        if (row.nombre.length < 2) rowErrors.push('Nombre inválido');
        if (row.apellido.length < 2) rowErrors.push('Apellido inválido');
        if (row.contraseña.length < 4) rowErrors.push('Contraseña muy corta');
        
        if (rowErrors.length > 0) {
          errors.push({ row: i + 1, errors: rowErrors });
        } else {
          let groupId = null;
          if (row.grupo) {
            const group = groups.find(g => 
              g.name.toLowerCase().includes(row.grupo.toLowerCase())
            );
            if (group) groupId = group.id;
          }
          
          preview.push({
            dni: row.dni,
            name: `${row.nombre} ${row.apellido}`,
            password: row.contraseña,
            groupId: groupId,
            role: 'student',
            status: 'active',
            groupIds: groupId ? [groupId] : []
          });
        }
      }
      
      setImportPreview(preview);
      if (errors.length > 0) setImportErrors(errors);
    } catch (error) {
      setImportErrors(['Error al procesar el archivo CSV']);
    }
  };
  reader.readAsText(file);
};

// Import users from preview
const handleImportUsers = async () => {
  if (importPreview.length === 0) {
    alert('No hay usuarios para importar');
    return;
  }
  
  try {
    const newUsers = [...users];
    const newGroups = [...groups];
    
    importPreview.forEach(user => {
      newUsers.push(user);
      
      if (user.groupId) {
        const groupIndex = newGroups.findIndex(g => g.id === user.groupId);
        if (groupIndex !== -1 && !newGroups[groupIndex].members.includes(user.dni)) {
          newGroups[groupIndex].members = [...newGroups[groupIndex].members, user.dni];
        }
      }
    });
    
    setUsers(newUsers);
    setGroups(newGroups);
    
    await saveToFirebase('users', newUsers);
    await saveToFirebase('groups', newGroups);
    
    setImportFile(null);
    setImportPreview([]);
    setImportErrors([]);
    setShowImportUsersModal(false);
    
    alert(`✅ ¡${importPreview.length} usuarios importados exitosamente!`);
  } catch (error) {
    alert(`❌ Error al importar: ${error.message}`);
  }
};
  // Delete exam
  const handleDeleteExam = async () => {
    if (!examToDelete) return;

    try {
      // Remove exam
      const updatedExams = exams.filter(e => e.id !== examToDelete);
      
      // Remove habilitations related to this exam
      const updatedHabilitations = habilitations.filter(h => h.examId !== examToDelete);
      
      // Remove results related to this exam
      const updatedResults = results.filter(r => r.examId !== examToDelete);

      setExams(updatedExams);
      setHabilitations(updatedHabilitations);
      setResults(updatedResults);
      
      await saveToFirebase('exams', updatedExams);
      await saveToFirebase('habilitations', updatedHabilitations);
      await saveToFirebase('results', updatedResults);
      
      // Close modal IMMEDIATELY
      setShowDeleteExamModal(false);
      setExamToDelete(null);
      
      alert('Examen eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting exam:', error);
      alert('Error al eliminar el examen. Por favor, intenta de nuevo.');
      setShowDeleteExamModal(false);
      setExamToDelete(null);
    }
  };

  // Export results to CSV - FINAL CORRECTED VERSION WITH NUMERIC NOTE
  // Export results to CSV - CORREGIDA Y MEJORADA
const exportResults = () => {
  try {
    // Filter results by exam
    let filteredResults = [...results];
    if (selectedResultExam !== 'all') {
      const examIdNum = parseInt(selectedResultExam);
      filteredResults = filteredResults.filter(r => r.examId === examIdNum);
    }
    // Filter results by group
    if (selectedResultGroup !== 'all') {
      const groupIdNum = parseInt(selectedResultGroup);
      filteredResults = filteredResults.filter(r => {
        const student = users.find(u => u.dni === r.studentDni);
        return student && student.groupIds.includes(groupIdNum);
      });
    }
    
    if (filteredResults.length === 0) {
      alert('No hay resultados para exportar');
      return;
    }
    
    // Get headers
    const headers = ['Estudiante', 'Examen', 'Puntaje', 'Fecha'];
    
    // Get all unique question IDs from filtered exams
    const questionIds = [...new Set(filteredResults.flatMap(result => {
      const exam = exams.find(e => e.id === result.examId);
      return exam ? exam.questions.map(q => q.id) : [];
    }))];
    
    // Add question headers with sequential numbers
    const questionHeaders = questionIds.map((qId, index) => `Pregunta ${index + 1}`);
    const fullHeaders = [
      ...headers, 
      ...questionHeaders, 
      'Respuestas Correctas', 
      'Respuestas Incorrectas',
      'Nota Numérica'
    ];
    
    // Build rows
    const rows = filteredResults.map(result => {
      const student = users.find(u => u.dni === result.studentDni);
      const exam = exams.find(e => e.id === result.examId);
      
      // Get answers for each question (manejar caso donde no hay examen)
      const answerColumns = questionIds.map(qId => {
        if (!exam) return 'Examen no encontrado';
        
        const question = exam.questions.find(q => q.id === qId);
        if (!question) return 'Pregunta no encontrada';
        
        const selectedOptionId = result.answers?.[qId];
        if (!selectedOptionId) return 'No respondida';
        
        const selectedOption = question.options.find(o => o.id === selectedOptionId);
        const isCorrect = selectedOptionId === question.correctOptionId;
        
        return `${selectedOption?.text || 'No respondida'}${isCorrect ? ' ✓' : ' ✗'}`;
      });
      
      // Count correct and incorrect answers
      let correctCount = 0;
      let incorrectCount = 0;
      
      if (exam && result.answers) {
        exam.questions.forEach(question => {
          if (result.answers[question.id] === question.correctOptionId) {
            correctCount++;
          } else {
            incorrectCount++;
          }
        });
      }
      
      return [
        student?.name || result.studentDni || 'Usuario no encontrado',
        exam?.name || `Examen ${result.examId}`,
        `${result.score || 0}/${result.total || 10} (${((result.score || 0) / (result.total || 10) * 100).toFixed(0)}%)`,
        result.date || 'Sin fecha',
        ...answerColumns,
        correctCount,
        incorrectCount,
        result.score || 0 // ← NOTA NUMÉRICA
      ];
    });
    
    // Join headers and rows with semicolon (;) as delimiter
    const csvContent = '\ufeff' + [
      fullHeaders.join(';'),
      ...rows.map(row => row.map(cell => 
        typeof cell === 'string' && cell.includes(';') 
          ? `"${cell.replace(/"/g, '""')}"`
          : cell
      ).join(';'))
    ].join('\r\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `resultados_examenes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`✅ Se exportaron ${filteredResults.length} resultados exitosamente`);
  } catch (error) {
    console.error('Error exporting results:', error);
    alert(`❌ Error al exportar: ${error.message}\n\nPor favor, verifica que todos los exámenes tengan preguntas válidas.`);
  }
};

  // Student dashboard - get available exams
  const getAvailableExams = () => {
    if (!currentUser?.groupIds || currentUser.groupIds.length === 0) return [];
    
    return exams.filter(exam =>
      // Check if exam is enabled for any of the student's groups
      habilitations.some(h =>
        h.examId === exam.id &&
        currentUser.groupIds.includes(h.groupId)
      ) && 
      // Check if student hasn't taken this exam yet
      !results.some(r =>
        r.studentDni === currentUser.dni && r.examId === exam.id
      )
    );
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-800">Cargando datos...</h2>
          <p className="text-gray-600 mt-2">Por favor espera un momento</p>
        </div>
      </div>
    );
  }

  // Admin sidebar navigation
  const renderAdminSidebar = () => (
    <div className="w-64 bg-gray-800 text-white min-h-screen p-6">
      <div className="flex items-center mb-10">
        <span className="text-2xl mr-2">🎓</span>
        <span className="text-xl font-bold">ExamProm</span>
      </div>
      <nav>
        <ul className="space-y-2">
          {[
            { id: 'exams', label: '📝 Exámenes', icon: '📝' },
            { id: 'groups', label: '📚 Grupos', icon: '📚' },
            { id: 'users', label: '👥 Usuarios', icon: '👥' },
            { id: 'results', label: '📊 Resultados', icon: '📊' },
            { id: 'enable', label: '⚡ Habilitaciones', icon: '⚡' }
          ].map(item => (
            <motion.li
              key={item.id}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                onClick={() => setAdminSection(item.id)}
                className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                  adminSection === item.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                }`}
              >
                <span className="mr-3 text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            </motion.li>
          ))}
        </ul>
      </nav>
      <div className="mt-10 pt-6 border-t border-gray-700">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mr-3">
            <span className="text-white font-bold">{currentUser?.name?.charAt(0)}</span>
          </div>
          <div>
            <div className="font-medium">{currentUser?.name}</div>
            <div className="text-xs text-gray-400">{userRole === 'admin' ? 'Administrador' : 'Estudiante'}</div>
          </div>
        </div>
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
        >
          <span className="mr-2">🚪</span> Salir
        </motion.button>
      </div>
    </div>
  );

  // Admin sections
  const renderAdminSection = () => {
    switch (adminSection) {
      case 'exams':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">📝 Exámenes</h2>
              <motion.button
                onClick={() => {
                  setExamName('');
                  setExamDescription('');
                  setExamQuestions([{
                    id: Date.now(),
                    text: '',
                    options: [
                      { id: Date.now() + 1, text: '' },
                      { id: Date.now() + 2, text: '' },
                      { id: Date.now() + 3, text: '' }
                    ],
                    correctOptionId: null
                  }]);
                  setShowCreateExam(true);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
              >
                <span className="mr-2">+</span> Crear Examen
              </motion.button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map(exam => (
                <div key={exam.id} className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{exam.name}</h3>
                      {exam.description && (
                        <p className="text-gray-600 mt-1 text-sm">{exam.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <motion.button
                        onClick={() => {
                          setExamName(exam.name);
                          setExamDescription(exam.description || '');
                          setExamQuestions(exam.questions.map(q => ({
                            id: q.id,
                            text: q.text,
                            options: q.options.map(o => ({ id: o.id, text: o.text })),
                            correctOptionId: q.correctOptionId
                          })));
                          setEditingExam(exam);
                          setShowEditExam(true);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-blue-500 hover:text-blue-700"
                        title="Editar examen"
                      >
                        ✏️
                      </motion.button>
                      <motion.button
                        onClick={() => confirmDeleteExam(exam.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-red-500 hover:text-red-700"
                        title="Eliminar examen"
                      >
                        🗑️
                      </motion.button>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{exam.questions.length} preguntas</span>
                      <span>Puntaje máximo: 10</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Create/Edit Exam Modal */}
            {(showCreateExam || showEditExam) && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      {showEditExam ? 'Editar Examen' : 'Crear Examen'}
                    </h3>
                    <button onClick={() => {
                      setShowCreateExam(false);
                      setShowEditExam(false);
                      setEditingExam(null);
                    }} className="text-gray-500 hover:text-gray-700">
                      ✕
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Examen</label>
                      <input
                        type="text"
                        value={examName}
                        onChange={(e) => setExamName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ingrese el nombre del examen"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                      <textarea
                        value={examDescription}
                        onChange={(e) => setExamDescription(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="2"
                        placeholder="Ingrese una descripción para el examen"
                      />
                    </div>
                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-lg text-gray-800">Preguntas</h4>
                        <motion.button
                          onClick={addQuestion}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 rounded-lg text-sm flex items-center"
                        >
                          <span className="mr-1">+</span> Agregar Pregunta
                        </motion.button>
                      </div>
                      {examQuestions.map((question, qIndex) => (
                        <div key={question.id} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="flex justify-between items-start mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Pregunta {qIndex + 1}
                            </label>
                            {examQuestions.length > 1 && (
                              <motion.button
                                onClick={() => removeQuestion(question.id)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                Eliminar pregunta
                              </motion.button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={question.text}
                            onChange={(e) => setExamQuestions(examQuestions.map(q =>
                              q.id === question.id ? { ...q, text: e.target.value } : q
                            ))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                            placeholder="Escribe la pregunta aquí"
                          />
                          <div className="space-y-2 mb-4">
                            {question.options.map((option, oIndex) => (
                              <div key={option.id} className="flex items-center">
                                <input
                                  type="radio"
                                  name={`correct-${question.id}`}
                                  checked={question.correctOptionId === option.id}
                                  onChange={() => setExamQuestions(examQuestions.map(q =>
                                    q.id === question.id ? { ...q, correctOptionId: option.id } : q
                                  ))}
                                  className="mr-2"
                                />
                                <input
                                  type="text"
                                  value={option.text}
                                  onChange={(e) => setExamQuestions(examQuestions.map(q =>
                                    q.id === question.id
                                      ? {
                                        ...q,
                                        options: q.options.map(o =>
                                          o.id === option.id ? { ...o, text: e.target.value } : o
                                        )
                                      }
                                      : q
                                  ))}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mr-2"
                                  placeholder={`Opción ${oIndex + 1}`}
                                />
                                {question.options.length > 2 && (
                                  <motion.button
                                    onClick={() => removeOption(question.id, option.id)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    ✕
                                  </motion.button>
                                )}
                              </div>
                            ))}
                          </div>
                          <motion.button
                            onClick={() => addOption(question.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            + Agregar opción
                          </motion.button>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                      <motion.button
                        onClick={() => {
                          setShowCreateExam(false);
                          setShowEditExam(false);
                          setEditingExam(null);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </motion.button>
                      <motion.button
                        onClick={showEditExam ? handleEditExam : handleCreateExam}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <span className="mr-2">💾</span> {showEditExam ? 'Guardar Cambios' : 'Crear Examen'}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Exam Modal */}
            {showDeleteExamModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Eliminar Examen</h3>
                    <button onClick={() => {
                      setShowDeleteExamModal(false);
                      setExamToDelete(null);
                    }} className="text-gray-500 hover:text-gray-700">
                      ✕
                    </button>
                  </div>
                  <div className="space-y-4">
                    <p className="text-gray-700">
                      ¿Estás seguro de que deseas eliminar este examen?<br />
                      <span className="text-red-600 font-medium">Esta acción no se puede deshacer.</span>
                    </p>
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Se eliminarán también:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Todas las habilitaciones de este examen</li>
                          <li>Todos los resultados de este examen</li>
                        </ul>
                      </p>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                      <motion.button
                        onClick={() => {
                          setShowDeleteExamModal(false);
                          setExamToDelete(null);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </motion.button>
                      <motion.button
                        onClick={handleDeleteExam}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Eliminar
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'groups':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">📚 Grupos</h2>
              <motion.button
                onClick={() => {
                  setGroupName('');
                  setGroupMembers([]);
                  setIsEditingGroup(false);
                  setEditingExam(null);
                  setShowCreateGroup(true);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
              >
                <span className="mr-2">+</span> Crear Grupo
              </motion.button>
            </div>
            <div className="space-y-4">
              {groups.map(group => (
                <div key={group.id} className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">📁 {group.name}</h3>
                      <div className="mt-2">
                        <div className="font-medium text-gray-700 mb-2">Miembros del Grupo:</div>
                        <div className="flex flex-wrap gap-2">
                          {group.members.length > 0 ? (
                            group.members.map(memberDni => {
                              const student = users.find(u => u.dni === memberDni && u.role === 'student' && u.status === 'active');
                              return student ? (
                                <span key={memberDni} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                  {student.name}
                                </span>
                              ) : null;
                            })
                          ) : (
                            <span className="text-gray-500 text-sm">No hay miembros en este grupo</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <motion.button
                        onClick={() => {
                          setGroupName(group.name);
                          setGroupMembers(group.members || []);
                          setIsEditingGroup(true);
                          setEditingExam(group);
                          setShowCreateGroup(true);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-blue-500 hover:text-blue-700"
                        title="Editar grupo"
                      >
                        ✏️
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          if (window.confirm(`¿Estás seguro de que deseas eliminar el grupo "${group.name}"?`)) {
                            // Remove group
                            const updatedGroups = groups.filter(g => g.id !== group.id);
                            // Remove group from all users
                            const updatedUsers = users.map(u => 
                              u.role === 'student' 
                                ? { ...u, groupIds: u.groupIds.filter(id => id !== group.id) }
                                : u
                            );
                            setGroups(updatedGroups);
                            setUsers(updatedUsers);
                            saveToFirebase('groups', updatedGroups);
                            saveToFirebase('users', updatedUsers);
                            alert('Grupo eliminado exitosamente');
                          }
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-red-500 hover:text-red-700"
                        title="Eliminar grupo"
                      >
                        🗑️
                      </motion.button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Create/Edit Group Modal */}
            {showCreateGroup && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      {isEditingGroup ? 'Editar Grupo' : 'Crear Grupo'}
                    </h3>
                    <button onClick={() => {
                      setShowCreateGroup(false);
                      setIsEditingGroup(false);
                      setEditingExam(null);
                    }} className="text-gray-500 hover:text-gray-700">
                      ✕
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Grupo</label>
                      <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ingrese el nombre del grupo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Miembros del Grupo</label>
                      <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 max-h-60 overflow-y-auto">
                        {users
                          .filter(u => u.role === 'student' && u.status === 'active')
                          .map(student => (
                            <div key={student.dni} className="flex items-center py-2 border-b border-gray-200 last:border-b-0">
                              <input
                                type="checkbox"
                                id={`member-${student.dni}`}
                                checked={groupMembers.includes(student.dni)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setGroupMembers([...groupMembers, student.dni]);
                                  } else {
                                    setGroupMembers(groupMembers.filter(dni => dni !== student.dni));
                                  }
                                }}
                                className="mr-3"
                              />
                              <label htmlFor={`member-${student.dni}`} className="text-sm text-gray-700">
                                {student.name} ({student.dni})
                              </label>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                      <motion.button
                        onClick={() => {
                          setShowCreateGroup(false);
                          setIsEditingGroup(false);
                          setEditingExam(null);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </motion.button>
                      <motion.button
                        onClick={handleCreateGroup}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {isEditingGroup ? 'Guardar Cambios' : 'Crear'}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'users':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
  <h2 className="text-2xl font-bold text-gray-800">👥 Usuarios</h2>
  <div className="flex space-x-3">
    <motion.button
      onClick={() => setShowImportUsersModal(true)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
    >
      <span className="mr-2">📥</span> Importar Usuarios
    </motion.button>
    <motion.button
      onClick={() => setShowAccountSettings(true)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
    >
      <span className="mr-2">⚙️</span> Mi Cuenta
    </motion.button>
  </div>
</div>
            {/* Search Section - Simple and Safe */}
<div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">🔍 Buscar por nombre o DNI</label>
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Ej: Juan o 12345678"
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">👥 Filtrar por grupo</label>
    <select
      value={searchByGroup}
      onChange={(e) => setSearchByGroup(e.target.value)}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="all">Todos los grupos</option>
      {groups.map(group => (
        <option key={group.id} value={group.id}>{group.name}</option>
      ))}
    </select>
  </div>
</div>
            {/* Pending Users Section */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Usuarios Pendientes de Aprobación</h3>
              {users.filter(u => u.status === 'pending' && u.role === 'student').length > 0 ? (
                <div className="space-y-4">
                  {users.filter(u => u.status === 'pending' && u.role === 'student').map(user => (
                    <div key={user.dni} className="border border-gray-200 rounded-lg p-4 bg-yellow-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{user.name}</h3>
                          <p className="text-gray-600 mt-1">DNI: {user.dni}</p>
                        </div>
                        <motion.button
                          onClick={() => handleApproveStudent(user.dni)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
                        >
                          <span className="mr-2">✅</span> Aprobar
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay usuarios pendientes de aprobación
                </div>
              )}
            </div>

            <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DNI</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grupos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users
  .filter(user => {
    // Filtrar por búsqueda de texto
    const matchesSearch = !searchQuery || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.dni.includes(searchQuery);
    
    // Filtrar por grupo
    const matchesGroup = searchByGroup === 'all' || 
      (user.role === 'student' && user.groupIds.includes(parseInt(searchByGroup)));
    
    return matchesSearch && matchesGroup;
  })
  .map(user => (
                    <tr key={user.dni} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.dni}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? 'Administrador' : 'Estudiante'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.role === 'student' && user.groupIds.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.groupIds.map(groupId => {
                              const group = groups.find(g => g.id === groupId);
                              return group ? (
                                <span key={groupId} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                  {group.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.status === 'active' ? 'Activo' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-3">
                        {user.status === 'pending' && user.role === 'student' && (
                          <motion.button
                            onClick={() => handleApproveStudent(user.dni)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="text-green-600 hover:text-green-800 font-medium"
                            title="Aprobar estudiante"
                          >
                            ✅
                          </motion.button>
                        )}
                        <motion.button
                          onClick={() => {
                            setEditingUser(user);
                            setEditName(user.name);
                            setEditDni(user.dni);
                            setEditPassword('');
                            setEditRole(user.role);
                            setEditGroups(user.groupIds || []);
                            setEditStatus(user.status);
                            setShowEditUser(true);
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          ✏️
                        </motion.button>
                        {user.dni !== currentUser.dni && (
                          <motion.button
                            onClick={() => {
                              setUserToDelete(user);
                              setShowDeleteUserModal(true);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            🗑️
                          </motion.button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Delete User Modal */}
            {showDeleteUserModal && userToDelete && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Eliminar Usuario</h3>
                    <button onClick={() => {
                      setShowDeleteUserModal(false);
                      setUserToDelete(null);
                    }} className="text-gray-500 hover:text-gray-700">
                      ✕
                    </button>
                  </div>
                  <div className="space-y-4">
                    <p className="text-gray-700">
                      ¿Estás seguro de que deseas eliminar al usuario <span className="font-bold">{userToDelete.name}</span>?<br />
                      <span className="text-red-600 font-medium">Esta acción no se puede deshacer.</span>
                    </p>
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Se eliminarán también:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Todas las respuestas y resultados del usuario</li>
                          <li>El usuario será removido de todos los grupos</li>
                        </ul>
                      </p>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                      <motion.button
                        onClick={() => {
                          setShowDeleteUserModal(false);
                          setUserToDelete(null);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </motion.button>
                      <motion.button
                        onClick={handleDeleteUser}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Eliminar
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Account Settings Modal */}
            {showAccountSettings && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">⚙️ Mi Cuenta</h3>
                    <button onClick={() => setShowAccountSettings(false)} className="text-gray-500 hover:text-gray-700">
                      ✕
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ingrese su contraseña actual"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo Nombre de Usuario (DNI)</label>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Dejar en blanco para no cambiar"
                      />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                      <motion.button
                        onClick={() => {
                          setShowAccountSettings(false);
                          setCurrentPassword('');
                          setNewUsername('');
                          setNewPassword('');
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </motion.button>
                      <motion.button
                        onClick={handleUpdateAccount}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Guardar Cambios
                      </motion.button>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      <motion.button
                        onClick={() => {
                          setShowAccountSettings(false);
                          setShowChangePassword(true);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center"
                      >
                        <span className="mr-2">🔑</span> Cambiar Contraseña
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Change Password Modal */}
            {showChangePassword && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">🔑 Cambiar Contraseña</h3>
                    <button onClick={() => setShowChangePassword(false)} className="text-gray-500 hover:text-gray-700">
                      ✕
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ingrese su contraseña actual"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ingrese la nueva contraseña"
                      />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                      <motion.button
                        onClick={() => {
                          setShowChangePassword(false);
                          setCurrentPassword('');
                          setNewPassword('');
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </motion.button>
                      <motion.button
                        onClick={handleChangePassword}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Guardar Cambios
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit User Modal */}
            {showEditUser && editingUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">✏️ Editar Usuario</h3>
                    <button onClick={() => setShowEditUser(false)} className="text-gray-500 hover:text-gray-700">
                      ✕
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">DNI/Usuario</label>
                      <input
                        type="text"
                        value={editDni}
                        onChange={(e) => setEditDni(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña (opcional)</label>
                      <input
                        type="password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Dejar en blanco para no cambiar"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="admin">Administrador</option>
                        <option value="student">Estudiante</option>
                      </select>
                    </div>
                    {editRole === 'student' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Grupos</label>
                        <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                          {groups.map(group => (
                            <div key={group.id} className="flex items-center py-2 border-b border-gray-200 last:border-b-0">
                              <input
                                type="checkbox"
                                id={`group-${group.id}`}
                                checked={editGroups.includes(group.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditGroups([...editGroups, group.id]);
                                  } else {
                                    setEditGroups(editGroups.filter(id => id !== group.id));
                                  }
                                }}
                                className="mr-3"
                              />
                              <label htmlFor={`group-${group.id}`} className="text-sm text-gray-700">
                                {group.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="active">Activo</option>
                        <option value="pending">Pendiente</option>
                      </select>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                      <motion.button
                        onClick={() => setShowEditUser(false)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </motion.button>
                      <motion.button
                        onClick={handleEditUser}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Guardar Cambios
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            )}
		            {/* Import Users Modal */}
            {showImportUsersModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">📥 Importar Usuarios Masivamente</h3>
                    <button onClick={() => {
                      setShowImportUsersModal(false);
                      setImportFile(null);
                      setImportPreview([]);
                      setImportErrors([]);
                    }} className="text-gray-500 hover:text-gray-700">
                      ✕
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-bold text-lg text-gray-800 mb-2">📋 Instrucciones:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-gray-700 text-sm">
                        <li>Descarga la <button onClick={downloadTemplate} className="text-blue-600 hover:underline font-medium">plantilla CSV</button></li>
                        <li>Llena con datos de tus estudiantes (separado por punto y coma)</li>
                        <li>Selecciona el archivo y haz clic en "Importar"</li>
                      </ol>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar archivo CSV:</label>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    {importFile && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium">{importFile.name}</p>
                            <p className="text-xs text-gray-500">{(importFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button
                            onClick={() => {
                              setImportFile(null);
                              setImportPreview([]);
                              setImportErrors([]);
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Eliminar
                          </button>
                        </div>
                        
                        {importPreview.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700">
                              ✅ {importPreview.length} usuario{importPreview.length !== 1 ? 's' : ''} listo{importPreview.length !== 1 ? 's' : ''} para importar
                            </p>
                          </div>
                        )}
                        
                        {importErrors.length > 0 && (
                          <div className="mt-3 bg-red-50 p-3 rounded border border-red-200">
                            <p className="text-sm font-medium text-red-800 mb-1">⚠️ Errores encontrados:</p>
                            <ul className="list-disc list-inside text-xs text-red-700">
                              {importErrors.map((err, i) => (
                                <li key={i}>Fila {err.row}: {err.errors.join(', ')}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                      <motion.button
                        onClick={() => {
                          setShowImportUsersModal(false);
                          setImportFile(null);
                          setImportPreview([]);
                          setImportErrors([]);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </motion.button>
                      <motion.button
                        onClick={handleImportUsers}
                        disabled={importPreview.length === 0 || importErrors.length > 0}
                        whileHover={importPreview.length === 0 || importErrors.length > 0 ? {} : { scale: 1.05 }}
                        whileTap={importPreview.length === 0 || importErrors.length > 0 ? {} : { scale: 0.95 }}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          importPreview.length === 0 || importErrors.length > 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {importErrors.length > 0 
                          ? 'Corregir errores' 
                          : importPreview.length === 0
                            ? 'Selecciona un archivo CSV'
                            : `Importar ${importPreview.length} usuarios`}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Approve Student Modal */}
            {showApproveModal && editingUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">✅ Aprobar Estudiante</h3>
                    <button onClick={() => setShowApproveModal(false)} className="text-gray-500 hover:text-gray-700">
                      ✕
                    </button>
                  </div>
                  <div className="space-y-4">
                    <p className="text-gray-700">
                      ¿Deseas aprobar al estudiante <span className="font-bold">{editingUser.name}</span> y asignarlo a grupos?
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Asignar a Grupos</label>
                      <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                        {groups.map(group => (
                          <div key={group.id} className="flex items-center py-2 border-b border-gray-200 last:border-b-0">
                            <input
                              type="checkbox"
                              id={`approve-group-${group.id}`}
                              checked={editGroups.includes(group.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditGroups([...editGroups, group.id]);
                                } else {
                                  setEditGroups(editGroups.filter(id => id !== group.id));
                                }
                              }}
                              className="mr-3"
                            />
                            <label htmlFor={`approve-group-${group.id}`} className="text-sm text-gray-700">
                              {group.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                      <motion.button
                        onClick={() => setShowApproveModal(false)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          // Update user status to active and assign groups
                          const updatedUsers = users.map(user => {
                            if (user.dni === editingUser.dni) {
                              return {
                                ...user,
                                status: 'active',
                                groupIds: editGroups
                              };
                            }
                            return user;
                          });
                          setUsers(updatedUsers);
                          saveToFirebase('users', updatedUsers);
                          setShowApproveModal(false);
                          setEditingUser(null);
                          setEditGroups([]);
                          alert('Estudiante aprobado exitosamente');
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={editGroups.length === 0}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          editGroups.length > 0
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Aprobar y Asignar
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'results':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">📊 Resultados</h2>
              <motion.button
                onClick={exportResults}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
              >
                <span className="mr-2">📥</span> Exportar Excel
              </motion.button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
                <select
                  value={selectedResultGroup}
                  onChange={(e) => setSelectedResultGroup(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos los grupos</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Examen</label>
                <select
                  value={selectedResultExam}
                  onChange={(e) => setSelectedResultExam(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos los exámenes</option>
                  {exams.map(exam => (
                    <option key={exam.id} value={exam.id}>{exam.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiante</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Examen</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puntaje</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nota</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results
                    .filter(result => {
                      // Filter by exam
                      if (selectedResultExam !== 'all' && result.examId.toString() !== selectedResultExam) {
                        return false;
                      }
                      // Filter by group
                      if (selectedResultGroup !== 'all') {
                        const student = users.find(u => u.dni === result.studentDni);
                        if (!student) return false;
                        return student.groupIds.includes(parseInt(selectedResultGroup));
                      }
                      return true;
                    })
                    .map((result, index) => {
                      const student = users.find(u => u.dni === result.studentDni);
                      const exam = exams.find(e => e.id === result.examId);
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student?.name || result.studentDni}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam?.name || `Examen ${result.examId}`}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              result.score >= 7
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {result.score}/{result.total}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                            {result.score}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <motion.button
                              onClick={() => {
                                setSelectedResult(result);
                                setShowResultDetail(true);
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Ver detalles"
                            >
                              👁️
                            </motion.button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Result Detail Modal */}
            {showResultDetail && selectedResult && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Detalles del Examen</h3>
                    <button onClick={() => setShowResultDetail(false)} className="text-gray-500 hover:text-gray-700">
                      ✕
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="font-bold text-lg text-gray-800 mb-2">
                        {exams.find(e => e.id === selectedResult.examId)?.name}
                      </div>
                      <div className="text-gray-700">
                        Estudiante: {users.find(u => u.dni === selectedResult.studentDni)?.name}
                      </div>
                      <div className="text-gray-700">
                        Fecha: {selectedResult.date}
                      </div>
                      <div className="mt-2 text-2xl font-bold text-green-600">
                        Puntaje: {selectedResult.score}/{selectedResult.total}
                      </div>
                      <div className="mt-2 text-xl font-bold text-blue-600">
                        Nota Numérica: {selectedResult.score}
                      </div>
                    </div>
                    <div className="space-y-4">
                      {exams.find(e => e.id === selectedResult.examId)?.questions.map((question, index) => {
                        const isCorrect = selectedResult.answers[question.id] === question.correctOptionId;
                        const selectedOption = question.options.find(o => o.id === selectedResult.answers[question.id]);
                        const correctOption = question.options.find(o => o.id === question.correctOptionId);
                        return (
                          <div key={question.id} className={`p-4 rounded-lg border ${
                            isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                          }`}>
                            <div className="font-bold mb-2">
                              Pregunta {index + 1}: {question.text}
                            </div>
                            <div className="space-y-2">
                              {question.options.map(option => (
                                <div
                                  key={option.id}
                                  className={`p-2 rounded border ${
                                    option.id === selectedResult.answers[question.id]
                                      ? (isCorrect
                                        ? 'border-green-500 bg-green-100'
                                        : 'border-red-500 bg-red-100')
                                      : (option.id === question.correctOptionId
                                        ? 'border-green-300 bg-green-50'
                                        : 'border-gray-200')
                                  }`}
                                >
                                  <div className="flex items-center">
                                    {option.id === selectedResult.answers[question.id] && (
                                      <span className={`mr-2 text-lg ${
                                        isCorrect ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {isCorrect ? '✓' : '✗'}
                                      </span>
                                    )}
                                    {option.id === question.correctOptionId &&
                                      option.id !== selectedResult.answers[question.id] && (
                                        <span className="mr-2 text-lg text-green-600">✓</span>
                                      )}
                                    <span>{option.text}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <motion.button
                      onClick={() => setShowResultDetail(false)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Cerrar
                    </motion.button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'enable':
        return (
          <div className="p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">⚡ Habilitaciones</h2>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Examen</label>
                  <select
                    value={selectedExam}
                    onChange={(e) => setSelectedExam(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar examen…</option>
                    {exams.map(exam => (
                      <option key={exam.id} value={exam.id}>{exam.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar grupo…</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showScore"
                    checked={showScore}
                    onChange={(e) => setShowScore(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showScore" className="ml-2 block text-sm text-gray-700">
                    Permitir que los estudiantes vean su nota final después de completar el examen
                  </label>
                </div>
                <motion.button
                  onClick={handleHabilitar}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center"
                >
                  <span className="mr-2">⚡</span> Habilitar Examen para Grupo
                </motion.button>
              </div>
            </div>
            {/* Habilitations List */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Habilitaciones Activas</h3>
              <div className="space-y-3">
                {habilitations.map((hab) => {
                  const exam = exams.find(e => e.id === hab.examId);
                  const group = groups.find(g => g.id === hab.groupId);
                  return (
                    <div key={hab.id} className="bg-white rounded-lg shadow p-4 border border-gray-100 flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-800">{exam?.name}</div>
                        <div className="text-sm text-gray-500">Grupo: {group?.name}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {hab.showScore ? '✓ Los estudiantes pueden ver su nota' : '✗ Los estudiantes no pueden ver su nota'}
                        </div>
                      </div>
                      <motion.button
                        onClick={() => confirmDeleteHabilitacion(hab.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-red-500 hover:text-red-700"
                        title="Eliminar habilitación"
                      >
                        🗑️
                      </motion.button>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Delete Habilitation Modal */}
            {showDeleteHabilitacionModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Eliminar Habilitación</h3>
                    <button onClick={() => {
                      setShowDeleteHabilitacionModal(false);
                      setHabilitationToDelete(null);
                    }} className="text-gray-500 hover:text-gray-700">
                      ✕
                    </button>
                  </div>
                  <div className="space-y-4">
                    <p className="text-gray-700">
                      ¿Estás seguro de que deseas eliminar esta habilitación? Esta acción no se puede deshacer.
                    </p>
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                      <motion.button
                        onClick={() => {
                          setShowDeleteHabilitacionModal(false);
                          setHabilitationToDelete(null);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </motion.button>
                      <motion.button
                        onClick={handleDeleteHabilitacion}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Eliminar
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Student dashboard
  const renderStudentDashboard = () => {
    if (currentExam) {
      return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <motion.button
              onClick={() => setCurrentExam(null)}
              whileHover={{ x: -5 }}
              className="mb-6 flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              <span className="mr-2">←</span> Volver a mis exámenes
            </motion.button>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                <h1 className="text-2xl font-bold">{currentExam.name}</h1>
                <div className="mt-2 flex justify-between text-blue-100">
                  <span>Preguntas: {Object.keys(studentAnswers).length}/{currentExam.questions.length}</span>
                  <span>Puntaje máximo: 10</span>
                </div>
              </div>
              <div className="p-6">
                {currentExam.questions.map((question, index) => (
                  <div key={question.id} className="mb-6 pb-6 border-b border-gray-100 last:border-b-0">
                    <div className="font-bold text-lg text-gray-800 mb-4">
                      {index + 1}. {question.text}
                    </div>
                    <div className="space-y-3">
                      {question.options.map(option => (
                        <label
                          key={option.id}
                          className={`block p-3 rounded-lg border cursor-pointer ${
                            studentAnswers[question.id] === option.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option.id}
                            checked={studentAnswers[question.id] === option.id}
                            onChange={() => setStudentAnswers({
                              ...studentAnswers,
                              [question.id]: option.id
                            })}
                            className="hidden"
                          />
                          <span className="ml-3 text-gray-700">{option.text}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 px-6 py-4 flex justify-end">
                {!examSubmitted ? (
                  <motion.button
                    onClick={handleSubmitExam}
                    disabled={isSubmitting || examSubmitted}
                    whileHover={isSubmitting || examSubmitted ? {} : { scale: 1.05 }}
                    whileTap={isSubmitting || examSubmitted ? {} : { scale: 0.95 }}
                    className={`${
                      isSubmitting || examSubmitted 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white font-bold py-3 px-8 rounded-lg flex items-center transition-all`}
                  >
                    <span className="mr-2">✅</span>
                    {isSubmitting ? 'Enviando...' : 'Enviar Respuestas'}
                  </motion.button>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-4xl font-bold text-green-600 mb-2">¡Examen completado!</div>
                    {(() => {
                      const result = results.find(r =>
                        r.studentDni === currentUser.dni &&
                        r.examId === currentExam.id
                      );
                      if (result?.showScore) {
                        return (
                          <div className="text-xl text-gray-700">
                            Tu puntaje es: <span className="font-bold text-blue-600">{result.score}/10</span><br />
                            <span className="text-3xl font-bold mt-2 block text-blue-600">Nota: {result.score}</span>
                          </div>
                        );
                      } else {
                        return (
                          <div className="text-xl text-gray-700">
                            Tu puntaje será publicado próximamente por el administrador
                          </div>
                        );
                      }
                    })()}
                    <motion.button
                      onClick={() => setCurrentExam(null)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg"
                    >
                      Volver a mis exámenes
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
    // Student exam list
    const availableExams = getAvailableExams();
    const completedExams = exams.filter(exam =>
      results.some(r => r.studentDni === currentUser.dni && r.examId === exam.id)
    );
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Mis Exámenes</h1>
              <p className="text-gray-600 mt-1">Bienvenido, {currentUser?.name}</p>
            </div>
            <div className="flex space-x-3">
              <motion.button
                onClick={() => setShowChangePassword(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
              >
                <span className="mr-2">🔑</span> Cambiar Contraseña
              </motion.button>
              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
              >
                <span className="mr-2">🚪</span> Salir
              </motion.button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available exams */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Próximos exámenes</h2>
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {availableExams.length}
                </span>
              </div>
              {availableExams.length > 0 ? (
                <div className="space-y-4">
                  {availableExams.map(exam => (
                    <div key={exam.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{exam.name}</h3>
                          {exam.description && (
                            <p className="text-gray-600 mt-1 text-sm">{exam.description}</p>
                          )}
                        </div>
                        <span className="text-blue-500 font-bold text-xl">✏️</span>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-sm text-gray-500">{exam.questions.length} preguntas</span>
                        <motion.button
                          onClick={() => handleStartExam(exam.id)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm"
                        >
                          Comenzar examen
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay exámenes disponibles en este momento
                </div>
              )}
            </div>
            {/* Completed exams */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Exámenes completados</h2>
                <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  {completedExams.length}
                </span>
              </div>
              {completedExams.length > 0 ? (
                <div className="space-y-4">
                  {completedExams.map(exam => {
                    const result = results.find(r =>
                      r.studentDni === currentUser.dni && r.examId === exam.id
                    );
                    return (
                      <div key={exam.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg text-gray-800">{exam.name}</h3>
                            <div className="mt-2 flex items-center">
                              {result?.showScore ? (
                                <>
                                  <span className="text-yellow-500 mr-1">★</span>
                                  <span className="font-bold text-green-600">{result.score}/10</span>
                                  <span className="text-gray-500 mx-2">|</span>
                                  <span className="font-bold text-blue-600 text-lg">Nota: {result.score}</span>
                                </>
                              ) : (
                                <span className="text-gray-500 italic">Puntaje oculto</span>
                              )}
                              <span className="text-gray-500 mx-2">|</span>
                              <span className="text-gray-500 text-sm">{result?.date}</span>
                            </div>
                          </div>
                          <span className="text-green-500 font-bold text-xl">✓</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aún no has completado ningún examen
                </div>
              )}
            </div>
          </div>
          {/* Change Password Modal for Student */}
          {showChangePassword && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">🔑 Cambiar Contraseña</h3>
                  <button onClick={() => setShowChangePassword(false)} className="text-gray-500 hover:text-gray-700">
                    ✕
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ingrese su contraseña actual"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ingrese la nueva contraseña"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                    <motion.button
                      onClick={() => {
                        setShowChangePassword(false);
                        setCurrentPassword('');
                        setNewPassword('');
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </motion.button>
                    <motion.button
                      onClick={handleChangePassword}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Guardar Cambios
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Login page
  const renderLoginPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <span className="text-5xl">🎓</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          ExamProm
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sistema de Gestión de Exámenes
        </p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Admin Login */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <span className="mr-2">👤</span> Administrador
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="admin-user" className="block text-sm font-medium text-gray-700">
                  Usuario
                </label>
                <div className="mt-1">
                  <input
                    id="admin-user"
                    type="text"
                    value={adminUser}
                    onChange={(e) => setAdminUser(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="admin"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <div className="mt-1">
                  <input
                    id="admin-password"
                    type="password"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              {loginError && (
                <div className="text-red-500 text-sm bg-red-50 p-2 rounded-md border border-red-200">
                  {loginError}
                </div>
              )}
              <div>
                <motion.button
                  onClick={() => handleLogin('admin')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Ingresar como Admin
                </motion.button>
              </div>
            </div>
          </div>
          {/* Student Login */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🎓</span> Alumno
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="student-dni" className="block text-sm font-medium text-gray-700">
                  DNI
                </label>
                <div className="mt-1">
                  <input
                    id="student-dni"
                    type="text"
                    value={studentDni}
                    onChange={(e) => setStudentDni(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ingrese su DNI"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="student-password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <div className="mt-1">
                  <input
                    id="student-password"
                    type="password"
                    value={studentPass}
                    onChange={(e) => setStudentPass(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              {loginError && (
                <div className="text-red-500 text-sm bg-red-50 p-2 rounded-md border border-red-200">
                  {loginError}
                </div>
              )}
              <div>
                <motion.button
                  onClick={() => handleLogin('student')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Ingresar como Alumno
                </motion.button>
              </div>
            </div>
          </div>
          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿No tenés cuenta?{" "}
              <button
                onClick={() => setShowRegister(true)}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Registrarte aquí
              </button>
            </p>
          </div>
        </div>
      </div>
      {/* Register Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Registro de Estudiante</h3>
              <button onClick={() => setShowRegister(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <p className="text-gray-600 mb-6">Completá los datos para registrarte. Un administrador deberá aprobar tu cuenta antes de poder ingresar.</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                  <input
                    type="text"
                    value={registerLastName}
                    onChange={(e) => setRegisterLastName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tu apellido"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DNI (solo números)</label>
                <input
                  type="text"
                  value={registerDni}
                  onChange={(e) => setRegisterDni(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tu DNI"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={registerPass}
                  onChange={(e) => setRegisterPass(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tu contraseña"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <motion.button
                  onClick={() => setShowRegister(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  ← Volver al login
                </motion.button>
                <motion.button
                  onClick={handleRegister}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Registrarse
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Main render
  if (currentPage === 'login') {
    return renderLoginPage();
  }
  if (currentPage === 'admin' && isLoggedIn && userRole === 'admin') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {renderAdminSidebar()}
        <div className="flex-1">
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">ExamProm</h1>
              <div className="flex items-center">
                <div className="mr-4 text-right">
                  <div className="font-medium text-gray-800">{currentUser?.name}</div>
                  <div className="text-xs text-gray-500">Administrador</div>
                </div>
                <motion.button
                  onClick={handleLogout}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
                >
                  <span className="mr-2">🚪</span> Salir
                </motion.button>
              </div>
            </div>
          </header>
          <main>
            {renderAdminSection()}
          </main>
        </div>
      </div>
    );
  }
  if (currentPage === 'student' && isLoggedIn && userRole === 'student') {
    return renderStudentDashboard();
  }
  return renderLoginPage();
}