/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import '@testing-library/jest-dom'
import { ROUTES, ROUTES_PATH } from '../constants/routes'
import { localStorageMock } from '../__mocks__/localStorage.js'
import mockStore from '../__mocks__/store.js'
import router from '../app/Router.js'

jest.mock('../app/store', () => mockStore)

describe('Given I am connected as an employee', () => {
  beforeEach(() => {
    // affiche les données de la page employé
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem(
      'user',
      JSON.stringify({
        type: 'Employee',
        email: 'a@a',
      })
    )
  })
  describe('When I am on NewBill Page', () => {
    // l'icône mail doit être en surbrilliance
    test('Then mail icon in vertical layout should be highlighted', async () => {
      const root = document.createElement('div')
      root.setAttribute('id', 'root')
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      // Test icône mail
      const mailIcon = screen.getByTestId('icon-mail')
      expect(mailIcon).toHaveClass('active-icon')
    })
    // Form
    test('Then the form should be displayed', () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      expect(screen.getByTestId('form-new-bill')).toBeTruthy()
      expect(screen.getByTestId('expense-type')).toBeTruthy()
      expect(screen.getByTestId('expense-name')).toBeTruthy()
      expect(screen.getByTestId('datepicker')).toBeTruthy()
      expect(screen.getByTestId('amount')).toBeTruthy()
      expect(screen.getByTestId('vat')).toBeTruthy()
      expect(screen.getByTestId('pct')).toBeTruthy()
      expect(screen.getByTestId('commentary')).toBeTruthy()
      expect(screen.getByTestId('file')).toBeTruthy()
      expect(screen.getByRole('button')).toBeTruthy()
    })
    // Tests upload fichier
    describe('When I upload a file', () => {
      // Clear mocks
      beforeEach(() => {
        jest.clearAllMocks()
      })
      afterEach(() => {
        jest.clearAllMocks()
      })
      // Test fichier correspondant
      test('Then, I can select a png, jpg or jpeg file', () => {
        // Affiche data
        const html = NewBillUI()
        document.body.innerHTML = html
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const newBillContainer = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        })
        // Fonction à tester
        const changeFile = jest.fn((e) => newBillContainer.handleChangeFile(e))
        // Input fichier
        const file = screen.getByTestId('file')
        expect(file).toBeTruthy()
        // Fichier jpg à tester
        const testFile = new File(['sample.jpg'], 'sample.jpg', {
          type: 'image/jpg',
        })
        file.addEventListener('change', changeFile)
        userEvent.upload(file, testFile)

        expect(changeFile).toHaveBeenCalled()
        expect(file.files[0]).toEqual(testFile)
        expect(file.files[0].name).toBe('sample.jpg')

        jest.spyOn(window, 'alert').mockImplementation(() => {})
        expect(window.alert).not.toHaveBeenCalled()
      })

      test("Then, I can't select a non-image file, and the page displays an alert", () => {
        const html = NewBillUI()
        document.body.innerHTML = html
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const newBillContainer = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        })

        const changeFile = jest.fn(newBillContainer.handleChangeFile)
        const file = screen.getByTestId('file')
        expect(file).toBeTruthy()
        
        // Test fichier type texte
        const testFile = new File(['sample test file'], 'sample.txt', {
          type: 'text/plain',
        })
        file.addEventListener('change', changeFile)
        userEvent.upload(file, testFile)

        expect(changeFile).toHaveBeenCalled()
        expect(file.files[0].name).not.toBe('sample.png')
        expect(file.files[0].type).not.toBe('image/png')
        // Mock
        jest.spyOn(window, 'alert').mockImplementation(() => {})
        expect(window.alert).toHaveBeenCalled()
        expect(file.value).toBe('')
      })
    })
  })
})

// Test d'intégration POST
describe('Given I am a user connected as Employee', () => {
  describe('When I submit a completed form', () => {
    test('Then a new bill should be created', async () => {
      const html = NewBillUI()
      document.body.innerHTML = html

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
          email: 'azerty@email.com',
        })
      )

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })
      // Test data bills
      const sampleBill = {
        type: 'Hôtel et logement',
        name: 'encore',
        date: '2004-04-04',
        amount: 400,
        vat: 80,
        pct: 20,
        commentary: 'séminaire billed',
        fileUrl:
          'https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a',
        fileName: 'preview-facture-free-201801-pdf-1.jpg',
        status: 'pending',
      }

      // Data form
      screen.getByTestId('expense-type').value = sampleBill.type
      screen.getByTestId('expense-name').value = sampleBill.name
      screen.getByTestId('datepicker').value = sampleBill.date
      screen.getByTestId('amount').value = sampleBill.amount
      screen.getByTestId('vat').value = sampleBill.vat
      screen.getByTestId('pct').value = sampleBill.pct
      screen.getByTestId('commentary').value = sampleBill.commentary

      newBill.fileName = sampleBill.fileName
      newBill.fileUrl = sampleBill.fileUrl
      // Fonction d'update
      newBill.updateBill = jest.fn()
      // Fonction de submit
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))

      const form = screen.getByTestId('form-new-bill')
      form.addEventListener('submit', handleSubmit)
      fireEvent.submit(form)

      expect(handleSubmit).toHaveBeenCalled()
      expect(newBill.updateBill).toHaveBeenCalled()
    })
    // Test erreur API
    test('fetches error from an API and fails with 500 error', async () => {
      jest.spyOn(mockStore, 'bills')
      jest.spyOn(console, 'error').mockImplementation(() => {})
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      Object.defineProperty(window, 'location', {
        value: { hash: ROUTES_PATH['NewBill'] },
      })

      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      document.body.innerHTML = `<div id="root"></div>`
      router()

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      mockStore.bills.mockImplementationOnce(() => {
        return {
          update: () => {
            return Promise.reject(new Error('Erreur 500'))
          },
        }
      })
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })

      // Submit form
      const form = screen.getByTestId('form-new-bill')
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      form.addEventListener('submit', handleSubmit)
      fireEvent.submit(form)
      await new Promise(process.nextTick)
      
      expect(console.error).toBeCalled()
    })
  })
})