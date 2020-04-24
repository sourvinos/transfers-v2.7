﻿using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Transfers {

    [Route("api/[controller]")]
    // [Authorize(Policy = "RequireLoggedIn")]
    public class CustomersController : ControllerBase {
        private readonly ICustomerRepository repo;
        public CustomersController(ICustomerRepository repo) => (this.repo) = (repo);

        [HttpGet]
        public async Task<IEnumerable<Customer>> Get() {
            return await repo.GetCustomers();
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCustomer(int id) {
            Customer customer = await repo.GetCustomer(id);
            if (customer == null) return NotFound(new { response = ApiMessages.RecordNotFound() });
            return Ok(customer);
        }

        [HttpPost]
        public IActionResult PostCustomer([FromBody] Customer customer) {
            if (!ModelState.IsValid) return BadRequest(new { response = ModelState.Values.SelectMany(x => x.Errors).Select(x => x.ErrorMessage) });
            repo.AddCustomer(customer);
            return Ok(new { response = ApiMessages.RecordCreated() });
        }

        [HttpPut("{id}")]
        public IActionResult PutCustomer([FromRoute] int id, [FromBody] Customer customer) {
            if (id != customer.Id) return BadRequest(new { response = ApiMessages.InvalidId() });
            if (!ModelState.IsValid) return BadRequest(new { response = ModelState.Values.SelectMany(x => x.Errors).Select(x => x.ErrorMessage) });
            try {
                repo.UpdateCustomer(customer);
            } catch (System.Exception) {
                return NotFound(new { response = ApiMessages.RecordNotFound() });
            }
            return Ok(new { response = ApiMessages.RecordUpdated() });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCustomer([FromRoute] int id) {
            Customer customer = await repo.GetCustomer(id);
            if (customer == null) return NotFound(new { response = ApiMessages.RecordNotFound() });
            try {
                repo.DeleteCustomer(customer);
                return Ok(new { response = ApiMessages.RecordDeleted() });
            } catch (DbUpdateException) {
                return BadRequest(new { response = ApiMessages.RecordInUse() });
            }
        }

    }

}