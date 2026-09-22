import { expect, test } from '@playwright/test'
import hmppsAuth from '../mockApis/hmppsAuth'
import exampleApi from '../mockApis/exampleApi'

import { login, resetStubs } from '../testUtils'
import HomePage from '../pages/homePage'

test.describe('SignIn', () => {
  test.beforeEach(async () => {
    await exampleApi.stubExampleTime()
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('Unauthenticated user directed to auth', async ({ page }) => {
    await hmppsAuth.stubSignInPage()
    await page.goto('/')

    await expect(page.getByRole('heading')).toHaveText('Sign in')
  })

  test('Unauthenticated user navigating to sign in page directed to auth', async ({ page }) => {
    await hmppsAuth.stubSignInPage()
    await page.goto('/sign-in')

    await expect(page.getByRole('heading')).toHaveText('Sign in')
  })

  test('User name visible in header', async ({ page }) => {
    await login(page, { name: 'A TestUser' })

    const homePage = await HomePage.verifyOnPage(page)

    await expect(homePage.usersName).toHaveText('A. Testuser')
  })

  test('Phase banner visible in header', async ({ page }) => {
    await login(page)

    const homePage = await HomePage.verifyOnPage(page)

    await expect(homePage.phaseBanner).toHaveText('dev')
  })

  test('User can sign out', async ({ page }) => {
    await login(page)

    const homePage = await HomePage.verifyOnPage(page)
    await homePage.signOut()

    await expect(page.getByRole('heading')).toHaveText('Sign in')
  })

  test('User can manage their details', async ({ page }) => {
    await login(page, { name: 'A TestUser' })

    await hmppsAuth.stubManageDetailsPage()

    const homePage = await HomePage.verifyOnPage(page)
    await homePage.clickManageUserDetails()

    await expect(page.getByRole('heading')).toHaveText('Your account details')
  })

  test('Token verification failure takes user to sign in page', async ({ page }) => {
    await login(page, { active: false })

    await expect(page.getByRole('heading')).toHaveText('Sign in')
  })

  test('Token verification failure clears user session', async ({ page }) => {
    await login(page, { name: 'A TestUser', active: false })

    await expect(page.getByRole('heading')).toHaveText('Sign in')

    await login(page, { name: 'Some OtherTestUser', active: true })

    const homePage = await HomePage.verifyOnPage(page)
    await expect(homePage.usersName).toHaveText('S. Othertestuser')
  })

  test('User with no roles cannot see any tile cards', async ({ page }) => {
    await login(page, { roles: [] })

    await HomePage.verifyOnPage(page)

    await expect(page.getByTestId('cashbook')).toHaveCount(0)
    await expect(page.getByTestId('bankadmin')).toHaveCount(0)
    await expect(page.getByTestId('nomsops')).toHaveCount(0)
  })

  test.describe('Tile card visibility per role', () => {
    const cardsByRole = [
      { testId: 'cashbook', role: 'MTP_CASH_BOOK' },
      { testId: 'bankadmin', role: 'MTP_BANK_ADMIN' },
      { testId: 'nomsops', role: 'MTP_NOMS_OPS' },
    ]

    for (const { testId, role } of cardsByRole) {
      test(`${testId} tile is visible with the ${role} role`, async ({ page }) => {
        await login(page, { roles: [`ROLE_${role}`] })

        await HomePage.verifyOnPage(page)

        await expect(page.getByTestId(testId)).toBeVisible()
      })
    }
  })
})
